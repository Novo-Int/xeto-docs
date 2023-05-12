import Eta from 'eta'
import fs from 'fs/promises'
import { Command } from 'commander'

import { LibsRegistry } from './loader'
import { haystackDocs } from './types/hs-defs'
import { Lib } from './types/Lib'
import { Type } from './types/Type'
import { BASE_URL } from './defaults.js'

type ArgOps = {
	ast: string
	targetDir: string
	baseUrl: string
}

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
		.option(
			'-b, --baseUrl <string>',
			'The base url to be used when generating links.'
		)
		.command('test', 'The library names to generate the docs for.')
		.arguments('[libs...]')
		.action(async (libs: string[], ops: ArgOps) => {
			const json = await fs.readFile(ops.ast, {
				encoding: 'utf-8',
			})
			const db = LibsRegistry.make(json)

			const templates = await loadTemplates()

			ops.baseUrl = ops.baseUrl ?? BASE_URL

			await render({
				db,
				libs,
				templates,
				ops,
				hsDocs,
			})
		})

	if (!process.argv.length) {
		command.showHelpAfterError()
	} else {
		try {
			command.parse()
		} catch {
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
	ops,
	hsDocs,
}: {
	db: LibsRegistry
	libs: string[]
	templates: string[]
	hsDocs: Map<string, string>
	ops: ArgOps
}) {
	const [libTemplate, typeTemplate] = templates
	const { targetDir } = ops

	const start = performance.now()

	for (const [libName, lib] of db.libs) {
		if (libs.length && !libs.includes(libName)) {
			continue
		}

		console.log(`Generating lib: ${libName}`)

		await renderLib(lib, libTemplate, targetDir)

		for (const type of lib.types) {
			console.log(`Generating type: ${type.typename}`)

			await renderType(typeTemplate, type, hsDocs, ops, libName)
		}
	}

	console.log(
		`Generating docs completed in ${(performance.now() - start).toFixed(
			2
		)}ms`
	)
}

async function renderLib(lib: Lib, libTemplate: string, targetDir: string) {
	const libPage = Eta.render(libTemplate, lib ?? {})
	await fs.mkdir(`${targetDir}/${lib.name}`, { recursive: true })
	await fs.writeFile(`${targetDir}/${lib.name}.mdx`, libPage)
}

async function renderType(
	typeTemplate: string,
	type: Type,
	hsDocs: Map<string, string>,
	ops: ArgOps,
	libName: string
) {
	const typePage = Eta.render(
		typeTemplate,
		{ type, hsDocs, baseUrl: ops.baseUrl } ?? {}
	)
	const { targetDir } = ops

	const path = `${targetDir}/${libName}/${type.fileName}`

	await fs.mkdir(path, {
		recursive: true,
	})

	await fs.writeFile(`${path}/${type.typename}.mdx`, typePage)

	if (type.subtypes.length > 0) {
		const typeFolder = `${path}/${type.typename}`
		await fs.mkdir(typeFolder, {
			recursive: true,
		})
		await renderSubtypes(type.subtypes, typeFolder, ops)
	}
}

async function renderSubtypes(types: Type[], path: string, ops: ArgOps) {
	const meta = {} as Record<string, unknown>

	const { baseUrl } = ops

	for (const type of types) {
		meta[type.typename] = {
			title: type.typename,
			href: `${baseUrl}${type.link}`,
		}
	}
	await fs.writeFile(`${path}/_meta.json`, JSON.stringify(meta, null, 2))
}

main()
