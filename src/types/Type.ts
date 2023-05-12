import { BaseType } from './BaseType'
import type { Lib } from './Lib'
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

		const slotsData = props.slots as Record<string, object>
		if (slotsData) {
			this.slots = this.slotTypes(slotsData, lib)
		}
	}

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

	get libName(): string {
		return this.type?.split('::')?.[0] ?? ''
	}

	get typename(): string {
		return this.type?.split('::')?.[1] ?? ''
	}

	get markers(): string[] {
		const res = [] as string[]
		Object.entries(this.slots).forEach(([name, type]) => {
			if (type.type === 'sys::Marker') {
				res.push(name)
			}
		})

		return res
	}

	get points(): Type[] {
		const res = [] as Type[]
		Object.entries(this.slots).forEach(([name, type]) => {
			if (type.of === 'ph::Point') {
				Object.values(type.slots).forEach((slot) => {
					res.push(slot)
				})
			}
		})

		return res
	}

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

	get subtypes(): Type[] {
		const list = new Map<string, Type>()

		this.lib?.types.forEach((type) => {
			if (type.type && type.base === this.type) {
				list.set(type.type, type)
			}
		})

		return [...list.values()]
	}

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

	get link(): string {
		return `${this.libName}/${this.fileName}/${this.typename}`
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
