import { Command } from 'commander'
import Eta from 'eta'
import fs from 'fs/promises'

import { BASE_URL } from './defaults.js'
import { LibsRegistry } from './loader'
import { Lib } from './types/Lib'
import {
	LibSummary,
	TypeSummary,
	librarySummary,
	typeSummary,
} from './types/Summary'
import { Type } from './types/Type'
import { haystackDocs } from './types/hs-defs'
import * as utils from './types/utils'

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

async function loadTemplates(): Promise<string[]> {
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

	const start = performance.now()

	for (const [libName, lib] of db.libs) {
		if (libs.length && !libs.includes(libName)) {
			continue
		}

		console.log(`Generating lib: ${libName}`)

		await renderLib(lib, libTemplate, ops)

		const summary = await librarySummary(lib)
		await renderFromSummary({ summary, lib, templates, ops, hsDocs })

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

async function renderLib(lib: Lib, libTemplate: string, ops: ArgOps) {
	const libPage = Eta.render(libTemplate, lib ?? {})

	const targetDir = `${ops.targetDir}/specs`
	await fs.mkdir(targetDir, { recursive: true })

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
	const { targetDir } = ops

	const path = `${targetDir}/specs/${libName}/${type.fileName}`
	await fs.mkdir(path, {
		recursive: true,
	})

	await renderTypeImpl(path, type, typeTemplate, hsDocs, ops)
}

async function renderTypeImpl(
	path: string,
	type: Type,
	typeTemplate: string,
	hsDocs: Map<string, string>,
	ops: ArgOps
) {
	let summary: TypeSummary | undefined

	if (type.points && type.points.length > 0) {
		for (const p of type.points) {
			summary = await typeSummary(p, summary)
		}
	}

	const typePage = Eta.render(
		typeTemplate,
		{ type, hsDocs, baseUrl: ops.baseUrl, summary: summary, utils } ?? {}
	)

	await fs.writeFile(`${path}/${type.typename}.mdx`, typePage)

	if (type.subtypes.length > 0) {
		for (const subt of type.subtypes) {
			const typeFolder = `${path}/${type.typename}`
			await fs.mkdir(typeFolder, {
				recursive: true,
			})
			await renderTypeImpl(typeFolder, subt, typeTemplate, hsDocs, ops)
		}
	}
}

async function renderFromSummary({
	summary,
	lib,
	templates,
	ops,
	hsDocs,
}: {
	summary: LibSummary
	lib: Lib
	templates: string[]
	ops: ArgOps
	hsDocs: Map<string, string>
}) {
	const [, typeTemplate] = templates

	const { targetDir } = ops

	if (summary.equips) {
		const equipsPath = `${targetDir}/equips/${lib.name}/`
		await fs.mkdir(equipsPath, { recursive: true })

		for (const [equipVariant, entries] of Object.entries(summary.equips)) {
			console.log(`Generating equip summary: ${equipVariant}`)
			for (const type of Object.values(entries)) {
				await renderTypeImpl(
					equipsPath,
					type,
					typeTemplate,
					hsDocs,
					ops
				)
			}
		}
	}

	if (summary.points) {
		const pointsPath = `${targetDir}/points/${lib.name}`
		await fs.mkdir(pointsPath, { recursive: true })

		for (const [choiceType, entries] of Object.entries(summary.points)) {
			console.log(`Generating point summary: ${choiceType}`)

			const choiceTypePath = `${pointsPath}/${choiceType}`
			await fs.mkdir(choiceTypePath, { recursive: true })

			for (const [choiceVariant, types] of Object.entries(entries)) {
				const choiceVariantPath = `${choiceTypePath}/${choiceVariant}`
				await fs.mkdir(choiceVariantPath, { recursive: true })

				for (const type of Object.values(types)) {
					await renderTypeImpl(
						choiceVariantPath,
						type,
						typeTemplate,
						hsDocs,
						ops
					)
				}
			}
		}
	}
}

main()
