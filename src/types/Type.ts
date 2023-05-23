import { memoize } from 'haystack-core'
import { BaseType } from './BaseType'
import type { Lib } from './Lib'
import { Resource } from './Resource'
import { getOptionalString } from './utils'

/**
 * The basic type definition for Xeto
 */
export class Type extends BaseType {
	/**
	 * Is and abstract type
	 */
	isAbstract?: boolean

	/**
	 * Is a sealed type
	 */
	isSealed?: boolean

	/**
	 * The base type
	 */
	base?: string

	/**
	 * Of a type, in case the type is generic
	 */
	of?: string | string[]

	/**
	 * The library for this type
	 */
	lib?: Lib

	/**
	 * Optional value
	 */
	val?: unknown

	/**
	 * Create a new type
	 * @param name The name of the type
	 * @param base The base type
	 * @param lib The library for this type
	 * @returns The type
	 */
	constructor(name?: string, base?: string, lib?: Lib) {
		super(name)

		this.base = base
		this.lib = lib
	}

	override fromProps(props: Record<string, object>, lib?: Lib) {
		super.fromProps(props)

		if (props.ofs) {
			this.of = props.ofs as string[]
		} else {
			this.of = getOptionalString('of', props)
		}

		this.isAbstract = getOptionalString('abstract', props) === 'marker'
		this.isSealed = getOptionalString('sealed', props) === 'marker'

		this.val = props.val

		const slotsData = props.slots as Record<string, object>
		if (slotsData) {
			this.slots = this.slotTypes(slotsData, lib)
		}
	}

	/**
	 * Make a type from a set of properties
	 * @param props The properties to create the type from
	 * @param defaultName The default name of the type
	 * @param lib The library for this type
	 * @returns The type
	 */
	static make(
		props: Record<string, object>,
		defaultName?: string,
		lib?: Lib
	): Type {
		const name = defaultName ?? getOptionalString('type', props)
		const base = getOptionalString('base', props)

		const type = new Type(name, base, lib)
		type.fromProps(props, lib)

		return type
	}

	static instantiate(
		form: Type,
		props: Pick<Type, 'of'> &
			Pick<Type, 'type'> &
			Pick<Type, 'base'> &
			Pick<Type, 'slots'> &
			Pick<Type, 'doc'>
	): Type {
		const clone = form.clone()

		if (props.type === 'sys::And' || props.type === 'sys::Or') {
			clone.of = props.of
			clone.base = props.type
			clone.type = props.base
		}

		Object.entries(props.slots).forEach(([name, type]) => {
			clone.slots[name] = type
		})

		clone.doc = props.doc

		return clone
	}

	override clone(): Type {
		const clone = new Type(this.type, this.base, this.lib)
		clone.doc = this.doc
		clone.loc = this.loc
		clone.slots = { ...this.slots }
		clone.isAbstract = this.isAbstract
		clone.isSealed = this.isSealed
		clone.of = this.of
		clone.val = this.val

		return clone
	}

	/**
	 * Get the library name
	 */
	get libName(): string {
		return this.type?.split('::')?.[0] ?? ''
	}

	/**
	 * Get the type name
	 */
	get typename(): string {
		return this.type?.split('::')?.[1] ?? ''
	}

	/**
	 * Get the markers for this type
	 */
	@memoize()
	get markers(): string[] {
		const res = [] as string[]
		Object.entries(this.slots).forEach(([name, type]) => {
			if (type.type === 'sys::Marker') {
				res.push(name)
			}
		})

		return res
	}

	get selfMarkers(): string[] {
		const markers = this.markers
		const inherited = this.inheritedMarkers

		return markers.filter((m) => !inherited.find((v) => v.name === m))
	}

	/**
	 * Get the markers for this type and all super types
	 */
	@memoize()
	get allMarkers(): string[] {
		const res = new Set<string>()
		this.markers.forEach((m) => res.add(m))

		this.inheritedMarkers.forEach((m) => res.add(m.name))

		return [...res]
	}

	/**
	 * Get the markers tgar are inherited from super types. This will return the
	 * marker name and the type that it was inherited from
	 */
	get inheritedMarkers(): { name: string; type: string }[] {
		const res = [] as { name: string; type: string }[]
		const added = [] as string[]
		this.allSuperTypes.reverse().forEach((su) => {
			Object.entries(su.slots).forEach(([name, type]) => {
				if (type.type === 'sys::Marker' && !added.includes(name)) {
					res.push({ name, type: su.typename })
					added.push(name)
				}
			})
		})

		return res.reverse()
	}

	get nonSpecialSlots(): Record<string, Type> {
		const res = {} as Record<string, Type>
		Object.entries(this.slots).forEach(([name, type]) => {
			if (!isSpecialSlot(name, type)) {
				res[name] = type
			}
		})

		return res
	}

	get inheritedNonSpecialSlots(): Record<string, Type> {
		const res = {} as Record<string, Type>
		this.allSuperTypes.forEach((su) => {
			Object.entries(su.slots).forEach(([name, type]) => {
				if (!isSpecialSlot(name, type) && !!res[name]) {
					res[name] = type
				}
			})
		})

		return res
	}

	/**
	 * If this is a point type or this has slots of point types
	 * return the point types
	 */
	get points(): Type[] {
		if (this.allSuperTypes.find((st) => st.type === 'ph::Point')) {
			return [this]
		}

		const res = [] as Type[]
		Object.values(this.slots).forEach((type) => {
			if (type.of !== 'ph::Point') {
				return
			}

			Object.values(type.slots).forEach((slot) => {
				const point = slot.type
					? this.lib?.getType(slot.type)
					: undefined
				if (point) {
					res.push(point)
				}
			})
		})

		return res
	}

	/**
	 * Get the equip slots for this type
	 */
	get equips(): Type[] {
		const res = [] as Type[]
		Object.values(this.slots).forEach((type) => {
			if (type.of === 'ph::Equip') {
				Object.values(type.slots).forEach((slot) => {
					res.push(slot)
				})
			}
		})

		return res
	}

	/**
	 * Get the resource slots for this type
	 */
	get resources(): Resource[] {
		const res = [] as Resource[]
		Object.entries(this.slots).forEach(([slotName, type]) => {
			if (slotName !== 'resources' && type.type !== 'ph::Dict') {
				return
			}

			Object.values(type.slots).forEach((slot) => {
				let resType = slot.type
					? this.lib?.getType(slot.type)
					: undefined
				if (resType) {
					resType = Type.instantiate(resType, {
						type: slot.type,
						base: 'ph::Resource',
						of: slot.of,
						slots: slot.slots,
						doc: slot.doc,
					})
					res.push(new Resource(resType))
				}
			})
		})

		return res
	}

	get groupedResources(): Map<string, Resource[]> {
		const resMap = new Map()
		this.resources.forEach((res) => {
			if (
				res.backingType.base === 'sys::And' ||
				res.backingType.base === 'sys::Or'
			) {
				res.backingType.superTypes.forEach((t) => {
					if (!resMap.has(t.typename)) {
						resMap.set(t.typename, [])
					}
					resMap.get(t.typename).push(res)
				})
			} else {
				if (!resMap.has(res.backingType.typename)) {
					resMap.set(res.backingType.typename, [])
				}
				resMap.get(res.backingType.typename).push(res)
			}
		})
		return resMap
	}

	/**
	 * Get the direct super types for this type
	 */
	@memoize()
	get superTypes(): Type[] {
		if (!this.lib) {
			return []
		}

		const base = this.base

		if (base === 'sys::And' || base === 'sys::Or') {
			if (Array.isArray(this.of)) {
				return this.of.reduce((acc, of) => {
					const type = this.lib?.getType(of)
					if (type) {
						acc.push(type)
					}
					return acc
				}, [] as Type[])
			} else {
				const type = this.of ? this.lib.getType(this.of) : undefined
				return type ? [type] : []
			}
		}
		const type = base ? this.lib.getType(base) : undefined
		return type ? [type] : []
	}

	/**
	 * Get all super types for this type
	 */
	@memoize()
	get allSuperTypes(): Type[] {
		const list = new Map<string, Type>()

		const st = this.superTypes

		while (st.length > 0) {
			const cur = st.pop()
			if (!cur) continue

			if (cur.type) list.set(cur.type, cur)

			st.unshift(...cur.superTypes)
		}

		return [...list.values()]
	}

	/**
	 * Get the direct sub types for this type
	 */
	@memoize()
	get subtypes(): Type[] {
		const list = new Map<string, Type>()

		this.lib?.types.forEach((type) => {
			if (type.type && type.base === this.type) {
				list.set(type.type, type)
			}
		})

		return [...list.values()]
	}

	/**
	 * Get all sub types for this type
	 */
	@memoize()
	get allSubtypes(): Type[] {
		const list = new Map<string, Type>()

		const set = (type: Type) => {
			list.set(type.type ?? '', type)
			type.subtypes.forEach((st) => {
				set(st)
			})
		}

		this.subtypes.forEach((st) => {
			set(st)
		})

		return [...list.values()]
	}

	/**
	 * Gets the file name
	 * where this type was defined
	 */
	get fileName(): string {
		if (!this.loc) {
			return ''
		}

		const [, name] =
			/([a-zA-Z0-9._]+)(?:\.xeto)(?:\(\d+\s*,\s*\d+\))/.exec(this.loc) ??
			''

		return name
	}

	/**
	 * Gets the link to the type
	 */
	get link(): string {
		return `${this.libName}/${this.typename}`
	}

	private slotTypes(
		slotsData: Record<string, object>,
		lib: Lib | undefined
	): { [name: string]: Type } {
		return Object.entries(slotsData).reduce(
			(slots, [name, props]) => {
				const type =
					lib?.slots[name] ??
					Type.make(props as Record<string, object>)
				slots[name] = type

				return slots
			},
			{} as {
				[name: string]: Type
			}
		)
	}
}

const isSpecialSlot = (name: string, t: Type) => {
	return (
		t.type === 'sys::Marker' ||
		(t.type === 'sys::Dict' && (name === 'resources' || name === 'attrs'))
	)
}
