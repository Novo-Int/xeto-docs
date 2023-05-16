import type { Type } from './Type'

/**
 * A resource type associated with a type
 */
export class Resource {
	/** The backing type */
	readonly backingType: Type
	/** The slots */
	readonly slots: { [name: string]: Type }

	constructor(type: Type, slots: { [name: string]: Type }) {
		this.backingType = type
		this.slots = slots
	}

	/**
	 * The makers of the backing type
	 */
	get markers(): string[] {
		return this.backingType.markers
	}

	/**
	 * Uri of the resource
	 */
	get uri(): string {
		return this.slots.uri.val as string
	}
}
