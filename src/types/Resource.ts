import type { Type } from './Type'

/**
 * A resource type associated with a type
 */
export class Resource {
	/** The backing type */
	readonly backingType: Type

	constructor(type: Type) {
		this.backingType = type
	}

	/**
	 * The makers of the backing type
	 */
	get markers(): string[] {
		return this.backingType.allMarkers
	}

	/**
	 * Uri of the resource
	 */
	get doc(): string {
		return this.backingType.doc ?? ''
	}

	/**
	 * Uri of the resource
	 */
	get uri(): string {
		return this.backingType.slots.uri.val as string
	}
}
