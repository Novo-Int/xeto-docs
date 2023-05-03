import fs from 'fs/promises'
import { LibsRegistry } from './loader'

async function main() {
	const json = await fs.readFile('./test_data/ph.json', { encoding: 'utf-8' })
	const props = JSON.parse(json)

	const db = LibsRegistry.make(props)

	console.log(db.libs)
}

main()
