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

	constructor(name?: string, base?: string) {
		this.type = name
		this.base = base

		this.slots = {}
	}

	fromProps(props: Record<string, object>) {
		this.of = getOptionalString('of', props)

		this.doc = getOptionalString('doc', props)

		this.isAbstract = getOptionalString('abstract', props) === 'marker'
		this.isSealed = getOptionalString('sealed', props) === 'marker'

		const slotsData = props.slots as Record<string, object>

		if (slotsData) {
			this.slots = makeSlots(slotsData)
		}
	}

	static make(props: Record<string, object>, defaultName?: string): Type {
		const name = getOptionalString('type', props)
		const base = getOptionalString('base', props)

		const type = new Type(name, base)
		type.fromProps(props)

		return type
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

function makeSlots(slotsData: Record<string, object>): {
	[name: string]: Type
} {
	return Object.entries(slotsData).reduce(
		(slots, [name, props]) => {
			slots[name] = Type.make(props as Record<string, object>)
			return slots
		},
		{} as {
			[name: string]: Type
		}
	)
}
