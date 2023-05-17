import { Resource } from './Resource'
import { TypeSummary } from './Summary'
import { Type } from './Type'

export function getString(key: string, props: Record<string, unknown>): string {
	const val = props[key]

	if (typeof val !== 'string') {
		throw Error(
			`Can't get string, found: '${val}', for key: '${key}' in context: '${props}'`
		)
	}

	return val
}

export function getOptionalString(
	key: string,
	props: Record<string, unknown>
): string | undefined {
	const val = props[key]
	if (!val) {
		return undefined
	}

	if (typeof val !== 'string') {
		throw Error(`Can't get string, found: '${val}', for key: '${key}'`)
	}

	return val
}

export function typeHierarchyDiagram(t: Type): string {
	if (t.superTypes.length === 0) {
		return ''
	}

	const genItem = (name: string) => {
		return `${name.toLowerCase()}[<span>${name}<span>]`
	}

	const relationType = t.base === 'sys::Or' ? '-..->' : '---->'
	return t.superTypes.reduce((acc, it) => {
		return `\t${acc}${relationType}${genItem(
			it.typename
		)}\n${typeHierarchyDiagram(it)}`
	}, genItem(t.typename))
}

export function hasSummary(summary: TypeSummary): boolean {
	return (
		summary &&
		Object.keys(summary).length > 0 &&
		Object.values(summary).some((v) => Object.keys(v).length > 0)
	)
}

export function groupedResources(r: Resource[]): Map<string, Resource[]> {
	const resMap = new Map()
	r.forEach((res) => {
		res.backingType.superTypes.forEach((t) => {
			if (!resMap.has(t.typename)) {
				resMap.set(t.typename, [])
			}
			resMap.get(t.typename).push(res)
		})
	})
	return resMap
}

export function docWithFixedLinks(doc: string): string {
	if (!doc || doc.length === 0) {
		return ''
	}

	return doc.replaceAll('\n', ' ').replace(/(\[.+\])(\`.+\`)/g, '$1($2)')
}
