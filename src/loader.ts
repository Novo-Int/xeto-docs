import { Lib } from './types/Lib'

export class LibsRegistry {
	libs: Map<string, Lib> = new Map()

	static make(data: string | Record<string, object>): LibsRegistry {
		const db = new LibsRegistry()

		Lib.resolveExternalLib = (name: string) => {
			return db.libs.get(name)
		}

		return db.load(data)
	}

	load(data: string | Record<string, object>): this {
		if (typeof data === 'string') {
			data = JSON.parse(data)
		}

		Object.entries(data).forEach(([name, val]) => {
			const libData = val as Record<string, object>
			const lib = Lib.make(libData, name)
			this.libs.set(name, lib)
		})

		return this
	}
}
