let visit
let getHighlighter
let fromHtml
let toHtml

import('hast-util-from-html').then((f) => (fromHtml = f.fromHtml))
import('hast-util-to-html').then((t) => (toHtml = t.toHtml))

import('unist-util-visit').then((v) => {
	visit = v.visit
})
import('shiki').then((s) => (getHighlighter = s.getHighlighter))

const FILE_PATH = '@/components/Xeto'
const LANG_FILE_PATH = `${process.cwd()}/plugin/xeto.tmLanguage.json`

const IMPORT_XETO_NODE = {
	type: 'mdxjsEsm',
	value: `import { Xeto } from "${FILE_PATH}"`,
	data: {
		estree: {
			type: 'Program',
			sourceType: 'module',
			body: [
				{
					type: 'ImportDeclaration',
					specifiers: [
						{
							type: 'ImportSpecifier',
							imported: { type: 'Identifier', name: 'Xeto' },
							local: { type: 'Identifier', name: 'Xeto' },
						},
					],
					source: {
						type: 'Literal',
						value: FILE_PATH,
						raw: `"${FILE_PATH}"`,
					},
				},
			],
		},
	},
}

let _instance

const getInstance = async () => {
	if (_instance) {
		return _instance
	}

	_instance = await getHighlighter({
		theme: 'css-variables',
		langs: [
			{
				id: 'xeto',
				scopeName: 'source.xeto',
				aliases: ['xeto'],
				path: LANG_FILE_PATH,
			},
		],
	})

	return _instance
}

const getTitle = (meta) => {
	if (!meta || meta.length < 1 || !meta.includes('filename')) {
		return
	}

	return meta.match(/filename="(.+)"/)?.[1]
}

const getHighlightedLines = (meta) => {
	if (
		!meta ||
		meta.length < 1 ||
		(!meta.includes('{') && !meta.includes('}'))
	) {
		return
	}

	const description = meta.match(/{([\d,\- ]+)}/)?.[1]
	return description?.split(',').reduce((a, c) => {
		const range = c.split('-').map((n) => parseInt(n))
		const start = range[0]
		const end = range[1] || start

		for (let i = start; i <= end; i++) {
			a.push(i)
		}

		return a
	}, [])
}

const xetoElementNode = async (val, meta) => {
	const highlighter = await getInstance()

	const result = highlighter.codeToHtml(val, {
		lang: 'xeto',
	})

	const title = getTitle(meta)
	const highlightedLines = getHighlightedLines(meta)
	const tree = fromHtml(result, { fragment: true })
	const pre = tree.children[0]
	const hasTitle = title && title.trim().length > 0

	if (hasTitle) {
		tree.children.unshift({
			type: 'element',
			tagName: 'div',
			properties: {
				className:
					'nx-absolute nx-top-0 nx-z-[1] nx-w-full nx-truncate nx-rounded-t-xl nx-bg-primary-700/5 nx-py-2 nx-px-4 nx-text-xs nx-text-gray-700 dark:nx-bg-primary-300/10 dark:nx-text-gray-200'.split(
						' '
					),
			},
			children: [
				{
					type: 'text',
					value: title,
				},
			],
		})
	}

	pre.properties = {
		className:
			'nx-bg-primary-700/5 nx-mb-4 nx-overflow-x-auto nx-rounded-xl nx-font-medium nx-subpixel-antialiased dark:nx-bg-primary-300/10 nx-text-[.9em] contrast-more:nx-border contrast-more:nx-border-primary-900/20 contrast-more:nx-contrast-150 contrast-more:dark:nx-border-primary-100/40 nx-py-4'
				.split(' ')
				.concat(hasTitle ? 'nx-pt-12' : ''),
		dataTheme: 'default',
	}

	const code = pre.children[0]
	code.properties = {
		className:
			'nx-border-black nx-border-opacity-[0.04] nx-bg-opacity-[0.03] nx-bg-black nx-break-words nx-rounded-md nx-border nx-py-0.5 nx-px-[.25em] nx-text-[.9em] dark:nx-border-white/10 dark:nx-bg-white/10'.split(
				' '
			),
	}

	if (meta && meta.includes('showLineNumbers')) {
		code.properties = {
			...code.properties,
			className: code.properties.className.concat('[counter-reset:line]'),
			dataLineNumbers: true,
			dataLineNumbersMaxDigits: 1,
		}
	}

	if (highlightedLines && highlightedLines.length > 0) {
		let curLine = 1
		code.children = code.children.map((line) => {
			if (line.type === 'element' && line.tagName === 'span') {
				const isHighlighted = highlightedLines.includes(curLine)

				if (isHighlighted) {
					line.properties.className = [
						...line.properties.className,
						'highlighted',
					]
				}
				curLine++
			}
			return line
		})
	}

	return {
		type: 'mdxJsxFlowElement',
		name: 'Xeto',
		attributes: [],
		children: [
			{
				type: 'raw',
				value: `${toHtml(tree)}`,
			},
		],
	}
}

module.exports = {
	XetoMdxPlugin: () => async (tree, _file, done) => {
		const codeBlocks = []
		visit(tree, { type: 'code', lang: 'xeto' }, (node, index, parent) => {
			codeBlocks.push([node, index, parent])
		})

		if (codeBlocks.length !== 0) {
			for (const [node, index, parent] of codeBlocks) {
				parent.children.splice(
					index,
					1,
					await xetoElementNode(node.value, node.meta)
				)
			}
			tree.children.unshift(IMPORT_XETO_NODE)
		}

		done()
	},
}
