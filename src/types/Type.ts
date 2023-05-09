import type { Lib } from './Lib'

/**
 * The basic type definition for Xeto
 */
export class Type {
	/**
	  The FQN of the type
	 */
	type?: string

	/**
	 * The documentation string
	 */
	doc?: string

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
	of?: string

	/**
	 * List of slots this type has
	 */
	slots: { [name: string]: Type }

	/**
	 * The library for this type
	 */
	lib?: Lib

	/**
	 * The file and line
	 * location this type was defined
	 */
	loc?: string

	constructor(name?: string, base?: string, lib?: Lib) {
		this.type = name
		this.base = base
		this.lib = lib

		this.slots = {}
	}

	fromProps(props: Record<string, object>, lib?: Lib) {
		this.of = getOptionalString('of', props)

		this.doc = getOptionalString('doc', props)

		this.isAbstract = getOptionalString('abstract', props) === 'marker'
		this.isSealed = getOptionalString('sealed', props) === 'marker'

		this.loc = getOptionalString('fileloc', props)

		const slotsData = props.slots as Record<string, object>
		if (slotsData) {
			this.slots = makeSlots(slotsData, lib == (this as unknown), lib)
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

	get superType(): Type | undefined {
		const base = this.base

		return base ? this.lib?.getType(base) : undefined
	}

	get allSuperTypes(): Type[] {
		const list = new Map<string, Type>()

		let st = this.superType

		while (st) {
			if (st.type) list.set(st.type, st)
			st = st.superType
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
}

export function getString(key: string, props: Record<string, unknown>): string {
	const val = props[key]

	if (typeof val !== 'string') {
		throw Error(
			`Can't get string, found: '${val}', for key: '${key}' in context: '${props}'`
		)
	}

	return val
}

export function getOptionalString(
	key: string,
	props: Record<string, unknown>
): string | undefined {
	const val = props[key]
	if (!val) {
		return undefined
	}

	if (typeof val !== 'string') {
		throw Error(`Can't get string, found: '${val}', for key: '${key}'`)
	}

	return val
}

function makeSlots(
	slotsData: Record<string, object>,
	libSlot: boolean,
	lib?: Lib
): {
	[name: string]: Type
} {
	return Object.entries(slotsData).reduce(
		(slots, [name, props]) => {
			if (libSlot) {
				slots[name] = Type.make(
					props as Record<string, object>,
					`${lib?.name}::${name}`,
					lib
				)
			} else {
				slots[name] =
					lib?.slots[name] ??
					Type.make(props as Record<string, object>)
			}

			return slots
		},
		{} as {
			[name: string]: Type
		}
	)
}
