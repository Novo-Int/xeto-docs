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

	fromProps(props: Record<string, object>): void {
		this.doc = getOptionalString('doc', props)
		this.loc = getOptionalString('fileloc', props)
	}
}
