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
		return `${name.toLowerCase()}([${name}])`
	}

	const relationType = t.base === 'sys::Or' ? '-.->' : '--->'
	const diag = t.superTypes.reduce((acc, it) => {
		return `\t${acc}${relationType}${genItem(
			it.typename
		)};\n${typeHierarchyDiagram(it)}`
	}, genItem(t.typename))

	return diag
}

export function fixVideoLink(link: string): string {
	if (link.includes('youtube')) {
		return link.replace('watch?v=', 'embed/')
	} else if (link.includes('youtu.be')) {
		return link.replace('youtu.be', 'youtube.com/embed/')
	}

	return link
}

export function hasSummary(summary: TypeSummary): boolean {
	return (
		summary &&
		Object.keys(summary).length > 0 &&
		Object.values(summary).some((v) => Object.keys(v).length > 0)
	)
}

export function resourceCategories(
	r: Resource,
	groups: [string, Resource[]][]
): string[] {
	return groups.filter(([, val]) => val.includes(r)).map(([k]) => k)
}

export function categoryProp(cat: string): { abbr: string; color: string } {
	switch (cat) {
		case 'ExcelDocument':
			return { abbr: 'Excel', color: '#15803d' }
		case 'WordDocument':
			return { abbr: 'Doc', color: '#2456b4' }
		case 'PowerPointDocument':
			return { abbr: 'PPT', color: '#c0583a' }
		case 'PdfDocument':
			return { abbr: 'PDF', color: '#e03c31' }
		case 'AutoCadDocument':
			return { abbr: 'CAD', color: '#cb2f50' }
		case 'Video':
			return { abbr: 'Video', color: '#ec4899' }
		case 'InstallationGuide':
		case 'ConfigureGuide':
			return { abbr: 'Guide', color: '#6b7280' }
		case 'Manual':
		case 'CutSheet':
			return { abbr: 'Manual', color: '#a16207' }
	}

	return { abbr: cat, color: '#6b7280' }
}

const docLink = (link: string) => {
	link = link.slice(1, -1)
	if (link.includes('::')) {
		const prefix = link.split('::')[0]
		const suffix = link.split('::').length > 1 ? link.split('::')[1] : ''
		switch (prefix) {
			case 'docHaystack':
				return `https://project-haystack.org/doc/${prefix}/${suffix}`
		}

		return `${link}`
	} else {
		return `https://project-haystack.org/doc/lib-phIoT/${link}`
	}
}

export function docWithFixedLinks(doc: string): string {
	if (!doc || doc.length === 0) {
		return ''
	}

	return doc
		.replaceAll('\n', ' ')
		.replaceAll(/(\[.+\])\`(.+)\`/g, (m) => {
			return m.replaceAll(/\`.+\`/g, docLink)
		})
		.replaceAll(/\`.+\`/g, (m) => {
			const link = m.slice(1, -1)
			const suffix = link.includes('::') ? link.split('::')[1] : link

			return `[${suffix}](${docLink(m)})`
		})
}
