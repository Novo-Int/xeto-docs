/*
Copyright (c) 2022 Novo Studio, All rights reserved.
*/

import {
	HDict,
	HGrid,
	HList,
	HNamespace,
	HStr,
	HSymbol,
	MARKER,
	TrioReader,
	ZincReader,
	makeValue,
} from 'haystack-core'

import { promises as fs } from 'fs'
import Path from 'path'

/**
 * The URL of the normalized defs from project haystack
 */
const PH_NORMALIZED_DEFS_URI = `https://project-haystack.org/download/defs.zinc`

/**
 * Check def for the type
 * @param def The def to check
 * @param type The type to match
 * @returns True if the def is of the specified type
 */
export function isOfType(def: HDict, type: string): boolean {
	return !!def.get<HList<HSymbol>>('is')?.find((el) => el.value === type)
}

/**
 * For the given def, determine the best collection name
 * @param defName The def name to be analyzed
 * @param ns The defs namespace
 * @returns The collection name
 */
export function getCollectionName(defName: string, ns: HNamespace): string {
	// 1. Entity go in 'entity'
	if (defName === 'entity') {
		return 'entity'
	}

	// 2. Equips go in 'equip' collection
	if (defName === 'equip') {
		return 'equip'
	}

	// 3. Anything that is deriving directly from entity or equip, will be its own collections
	const superTypes = ns.superTypesOf(defName)
	if (
		superTypes.some(
			(type) => type.defName === 'entity' || type.defName === 'equip'
		)
	) {
		return defName
	}

	// 3.1 Search direct super types for ones extending equip or entity
	const directSupertype = superTypes.find((type) => {
		const superTypes = ns.superTypesOf(type.defName)
		return superTypes.some(
			(type) => type.defName === 'entity' || type.defName === 'equip'
		)
	})

	if (directSupertype) {
		return directSupertype.defName
	}

	// 4. Search all super types
	const allSuperTypes = ns.allSuperTypesOf(defName)

	// For anything that is equip, and is mandatory
	if (
		allSuperTypes.some(
			(type) => type.defName === 'entity' || type.defName === 'equip'
		)
	) {
		const type = allSuperTypes.find(
			(type) => type.get('mandatory') === MARKER
		)

		return type && type.defName !== 'equip' ? type.defName : defName
	}

	// 6. Return the def name as the collection name, if no super types match the criteria
	return defName
}

/**
 * Parse a Grid object from the file.
 * @param path Path to the file to be parsed.
 * @returns The parsed grid.
 */
export async function parseGridFile(path: string): Promise<HGrid> {
	const ext = Path.extname(path).slice(1)

	switch (ext) {
		case '.zinc':
			return new ZincReader(
				await fs.readFile(path, 'utf-8')
			).readValue() as HGrid
		case '.trio':
			return new TrioReader(await fs.readFile(path, 'utf-8')).readGrid()

		case '.json':
			return makeValue(
				JSON.parse(await fs.readFile(path, 'utf-8'))
			) as HGrid

		default:
			throw Error(`Invalid extension name: ${ext}`)
	}
}

/**
 * Initialize the default namespace with the provided defs
 * in the normalized grid.
 *
 * @param defsGrid
 */
export function initDefaultNamespace(defsGrid: HGrid): void {
	const ns = new HNamespace(defsGrid)
	HNamespace.defaultNamespace = ns
}

/**
 * Loads the normalized defs grid from the project haystack website
 * @param url Optional url to load the ontology from
 * @returns The normalized defs grid
 */
export async function loadPhNormalizedDefs(url?: string): Promise<HGrid> {
	const zincNormalized = await (
		await fetch(url ?? PH_NORMALIZED_DEFS_URI)
	).text()

	return new ZincReader(zincNormalized).readValue() as HGrid
}

export async function haystackDocs(): Promise<Map<string, string>> {
	const defs = await loadPhNormalizedDefs()
	const allDocs = new Map<string, string>()

	defs.getRows().forEach((d) => {
		const def = (d.get('def') as HSymbol)?.value
		const doc = (d.get('doc') as HStr)?.value
		if (def) {
			allDocs?.set(def, doc ?? '')
		}
	})

	return allDocs
}
