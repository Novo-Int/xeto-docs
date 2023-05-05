import { Lib } from './types/Lib'

export class LibsRegistry {
	libs: Map<string, Lib> = new Map()

	static make(data: string | Record<string, object>): LibsRegistry {
		if (typeof data === 'string') {
			data = JSON.parse(data)
		}

		const db = new LibsRegistry()

		Object.entries(data).forEach(([name, val]) => {
			const libData = val as Record<string, object>
			const lib = Lib.make(libData, name)
			db.libs.set(name, lib)
		})

		return db
	}
}
