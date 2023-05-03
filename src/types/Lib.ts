import { Type, getOptionalString, getString as getString } from './Type'

/**
 * Organization type
 */
export interface Org {
	dis?: string
	uri?: string
}

/**
 * Library type
 */
export class Lib extends Type {
	/**
	 * The name of the library
	 */
	name: string

	/**
	 * The version of the library
	 */
	version: string

	/**
	 * The organization making this library
	 */
	org?: Org

	/**
	 * List of dependencies
	 */
	depends?: Lib[]

	constructor(name: string, ver: string) {
		super('sys::Lib')

		this.name = name
		this.version = ver
	}

	override fromProps(props: Record<string, object>): void {
		super.fromProps(props)

		if (props.org) {
			const org = props.org as Record<string, object>
			this.org = {
				dis: getOptionalString('dis', org),
				uri: getOptionalString('uri', org),
			}
		}

		if (props.depends) {
			const depends = props.depends as Record<string, unknown>[]
			this.depends = []

			depends.forEach((props) => {
				const lib = new Lib(props.lib as string, '')
				this.depends?.push(lib)
			})
		}
	}

	static override make(props: Record<string, object>, name: string): Lib {
		const version = getString('version', props)

		const lib = new Lib(name, version)
		lib.fromProps(props)

		return lib
	}
}
