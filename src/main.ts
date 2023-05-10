import Eta from 'eta'
import fs from 'fs/promises'
import { Command } from 'commander'

import { LibsRegistry } from './loader'
import { haystackDocs } from './types/hs-defs'

async function main() {
	const hsDocs = await haystackDocs()
	const command = new Command()
		.name('Xeto Nextra doc generator')
		.description('Generates Nextra MDX files from Xeto library AST')
		.version('0.1.0')
		.option('-a, --ast <string>', 'Location of the Xeto JSON AST file.')
		.option(
			'-t, --targetDir <string>',
			'Location where to place the generated files.'
		)
		.command('test', 'The library names to generate the docs for.')
		.arguments('[libs...]')
		.action(
			async (
				libs: string[],
				ops: {
					ast: string
					targetDir: string
				}
			) => {
				const json = await fs.readFile(ops.ast, {
					encoding: 'utf-8',
				})
				const db = LibsRegistry.make(json)

				const templates = await loadTemplates()

				await render({
					db,
					libs,
					templates,
					targetDir: ops.targetDir,
					hsDocs,
				})
			}
		)

	if (!process.argv.length) {
		command.showHelpAfterError()
	} else {
		try {
			const ops = command.parse()
		} catch (error) {
			command.showHelpAfterError()
		}
	}
}

async function loadTemplates() {
	const libTemplate = await fs.readFile('./templates/lib.mdx', {
		encoding: 'utf-8',
	})

	const typeTemplate = await fs.readFile('./templates/type.mdx', {
		encoding: 'utf-8',
	})

	return [libTemplate, typeTemplate]
}

async function render({
	db,
	libs,
	templates,
	targetDir,
	hsDocs,
}: {
	db: LibsRegistry
	libs: string[]
	templates: string[]
	hsDocs: Map<string, string>
	targetDir: string
}) {
	const [libTemplate, typeTemplate] = templates

	const start = performance.now()

	for (const [libName, lib] of db.libs) {
		if (libs.length && !libs.includes(libName)) {
			continue
		}

		console.log(`Generating lib: ${libName}`)

		const libPage = Eta.render(libTemplate, lib ?? {})
		await fs.mkdir(`${targetDir}/${libName}`, { recursive: true })
		await fs.writeFile(`${targetDir}/${libName}.mdx`, libPage)

		for (const type of lib.types) {
			const typePage = Eta.render(typeTemplate, { type, hsDocs } ?? {})

			const path = `${targetDir}/${libName}/${type.fileName}`

			await fs.mkdir(path, {
				recursive: true,
			})

			console.log(`Generating type: ${type.typename}`)

			await fs.writeFile(`${path}/${type.typename}.mdx`, typePage)
		}
	}

	console.log(
		`Generating docs completed in ${(performance.now() - start).toFixed(
			2
		)}ms`
	)
}

main()
