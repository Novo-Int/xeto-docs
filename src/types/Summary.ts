import { HDict, HList, HNamespace, HStr, toTagName } from 'haystack-core'
import { Lib } from './Lib'
import { Type } from './Type'
import {
	getCollectionName,
	initDefaultNamespace,
	loadPhNormalizedDefs,
} from './hs-defs'
import { isOfType } from './hs-defs'

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
		for (const point of slot.points) {
			collectPoints(point, summary)
		}
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

	const pointMarkers = type.markers
	const markers = pointMarkers.filter((marker) => marker !== 'point')

	if (!markers.length) {
		const def = ns.get(toTagName(type.typename))
		if (def) {
			;(((summary.points ??= {})['point'] ??= {})[def.defName] ??= {})[
				type.typename
			] = type
		}
	} else {
		const pointTags = ns.tags('point')
		markers.forEach((marker) => {
			const allSuperTypes = ns.allSuperTypesOf(marker)
			let pointType = allSuperTypes.find(
				(type) => type.defName === 'point'
			)

			let choice: HDict | undefined
			if (!pointType) {
				const tagOnPoint = allSuperTypes.find((type) =>
					type
						.get<HList>('tagOn')
						?.find((el) => (el as HStr).value === 'point')
				)

				if (!tagOnPoint) {
					const superTypesChoice = allSuperTypes.find((type) =>
						ns.is(type.defName).find((t) => t.defName === 'choice')
					)

					const goesOnPoint = superTypesChoice
						?.get<HList<HStr>>('tagOn')
						?.find((el) => {
							const children = ns
								.get(el.value)
								?.get<HList<HDict>>('children')

							return !!children?.find((child) =>
								child.keys.every((k) =>
									pointMarkers.includes(k)
								)
							)
						})

					if (goesOnPoint) {
						choice = superTypesChoice
						pointType = ns.get(marker)
					} else {
						// Indirect choice
						choice = pointTags.find((tag) => {
							return (
								isOfType(tag, 'choice') &&
								allSuperTypes.find(
									(type) =>
										type.defName ===
										(tag.of as HStr | undefined)?.value
								)
							)
						})

						if (choice) {
							pointType = ns.get(marker)
						}
					}
				} else if (
					ns
						.superTypesOf(tagOnPoint.defName)
						.find((type) => type.defName === 'choice')
				) {
					choice = tagOnPoint
					pointType = ns.get(marker)
				}
			}

			if (pointType) {
				;(((summary.points ??= {})[choice?.defName ?? 'point'] ??= {})[
					pointType.defName
				] ??= {})[type.typename] = type
			}
		})
	}
}

async function ensureDefs() {
	if (Object.keys(HNamespace.defaultNamespace.defs).length > 0) {
		return
	}

	const defs = await loadPhNormalizedDefs()
	initDefaultNamespace(defs)
}
