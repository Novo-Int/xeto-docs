import type { Type } from './Type'
import { getOptionalString } from './utils'

export class BaseType {
	/**
	  The FQN of the type
	 */
	type?: string

	/**
	 * The documentation string
	 */
	doc?: string

	/**
	 * The file and line
	 * location this type was defined
	 */
	loc?: string

	/**
	 * List of slots this type has
	 */
	slots: { [name: string]: Type }

	constructor(type?: string) {
		this.type = type

		this.slots = {}
	}

	/**
	 * Create a new type from a set of properties
	 * @param props The properties to create the type from
	 * @returns The type
	 * @throws If the type is not valid
	 */
	fromProps(props: Record<string, object>): void {
		this.doc = getOptionalString('doc', props)
		this.loc = getOptionalString('fileloc', props)
	}

	clone(): BaseType {
		const clone = new BaseType(this.type)
		clone.doc = this.doc
		clone.loc = this.loc
		clone.slots = { ...this.slots }

		return clone
	}
}
