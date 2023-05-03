import fs from 'fs/promises'
import { LibsRegistry } from './loader'

async function main() {
	const json = await fs.readFile('./test_data/ph.json', { encoding: 'utf-8' })
	const props = JSON.parse(json)

	const db = LibsRegistry.make(props)

	const lib = db.libs.get('ph')
	const type = lib?.getType('Ahu')

	console.log(type?.libName)
	console.log(type?.markers)
	//console.log(lib?.markers)

	console.log(type?.allSuperTypes)

	console.log(type?.subtypes)

	{
		const type = lib?.getType('AirHandlingEquip')
		console.log(type?.allSubtypes)
	}

	//console.log(db.libs.get('ph')?.getType('Well'))
}

main()
