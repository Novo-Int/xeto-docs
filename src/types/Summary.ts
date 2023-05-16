import { HDict, HList, HNamespace, HStr, toTagName } from 'haystack-core'
import { Lib } from './Lib'
import { Type } from './Type'
import {
	getCollectionName,
	initDefaultNamespace,
	loadPhNormalizedDefs,
} from './hs-defs'

/**
 * The summary of a type
 */
export interface TypeSummary {
	points: {
		[choiceType: string]: {
			[choiceVariant: string]: { [typeName: string]: Type }
		}
	}
}

/**
 * The summary of a library
 */
export interface LibSummary extends TypeSummary {
	specs: { [name: string]: Type }
	equips: { [equipVariant: string]: { [name: string]: Type } }
}

/**
 * Create a summary for a given library
 * @param lib The library to summarize
 * @returns The summary
 */
export async function librarySummary(lib: Lib): Promise<LibSummary> {
	const summary = {} as LibSummary

	await ensureDefs()

	for (const slot of lib.types) {
		;(summary.specs ??= {})[slot.typename] = slot

		collectEquip(slot, summary)
		collectPoints(slot, summary)
	}

	return summary
}

/**
 * Create a point summary for a given type
 * @param type The type to summarize
 * @param summary The summary to add to
 * @returns The summary
 */
export async function typeSummary(
	type: Type,
	summary?: TypeSummary
): Promise<TypeSummary> {
	await ensureDefs()

	if (!summary) {
		summary = { points: {} }
	}

	collectPoints(type, summary)

	return summary
}

function collectEquip(type: Type, summary: LibSummary) {
	if (
		type.base !== 'ph::Equip' &&
		!type.allSuperTypes.find((st) => st.base === 'ph::Equip')
	) {
		return
	}

	const ns = HNamespace.defaultNamespace
	const markers = type.markers.filter((marker) => marker !== 'equip')

	let def: HDict | undefined

	if (markers.length === 0) {
		def = ns.get(toTagName(type.typename))
	} else {
		const bestFit = markers.find((marker) =>
			ns.allSuperTypesOf(marker).find((type) => type.defName === 'equip')
		)
		if (bestFit) {
			def = ns.get(bestFit)
		}
	}

	if (!def) {
		return
	}

	const collection = getCollectionName(def.defName, ns)

	;((summary.equips ??= {})[collection] ??= {})[def.defName] = type
}

function collectPoints(type: Type, summary: TypeSummary) {
	if (
		type.base !== 'ph::Point' &&
		!type.allSuperTypes.find((st) => st.base === 'ph::Point')
	) {
		return
	}

	const ns = HNamespace.defaultNamespace
	const markers = type.markers.filter((marker) => marker !== 'point')

	let def: HDict | undefined
	let choice: HDict | undefined

	if (markers.length === 0) {
		def = ns.get(toTagName(type.typename))
	} else {
		const bestFit = markers.find((marker) => {
			const allSuperTypes = ns.allSuperTypesOf(marker)
			let pointType = allSuperTypes.find(
				(type) => type.defName === 'point'
			)

			if (!pointType) {
				pointType = allSuperTypes.find((type) =>
					type
						.get<HList>('tagOn')
						?.find((el) => (el as HStr).value === 'point')
				)

				if (
					pointType &&
					ns
						.superTypesOf(pointType.defName)
						.find((type) => type.defName === 'choice')
				) {
					choice = pointType
				}
			}

			return pointType
		})
		if (bestFit) {
			def = ns.get(bestFit)
		}
	}

	if (!def) {
		return
	}

	;(((summary.points ??= {})[choice?.defName ?? 'point'] ??= {})[
		def.defName
	] ??= {})[type.typename] = type
}

async function ensureDefs() {
	if (Object.keys(HNamespace.defaultNamespace.defs).length > 0) {
		return
	}

	const defs = await loadPhNormalizedDefs()
	initDefaultNamespace(defs)
}
