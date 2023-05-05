import Eta from 'eta'
import fs from 'fs/promises'

import { LibsRegistry } from './loader'
import { haystackDocs } from './types/hs-defs'

async function main() {
	const hsDocs = await haystackDocs()
	const json = await fs.readFile('./test_data/ph.json', { encoding: 'utf-8' })
	const props = JSON.parse(json)

	const db = LibsRegistry.make(props)

	const libTemplate = await fs.readFile('./templates/lib.mdx', {
		encoding: 'utf-8',
	})

	const typeTemplate = await fs.readFile('./templates/type.mdx', {
		encoding: 'utf-8',
	})

	for (const [libName, lib] of db.libs) {
		const libPage = Eta.render(libTemplate, lib ?? {})
		await fs.mkdir(`./pages/${libName}`, { recursive: true })
		await fs.writeFile(`./pages/${libName}/index.mdx`, libPage)

		for (const type of lib.types) {
			const typePage = Eta.render(typeTemplate, { type, hsDocs } ?? {})
			await fs.writeFile(
				`./pages/${libName}/${type.typename}.mdx`,
				typePage
			)
		}
	}
}

main()
