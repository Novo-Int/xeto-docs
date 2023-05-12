import * as Eta from 'eta'
import fs from 'fs/promises'
import { GetStaticPaths } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { GetStaticPropsContext } from 'next/types'
import { compileMdx } from 'nextra/compile'
import { useMDXComponents } from 'nextra/mdx'
import path from 'path'
import React from 'react'
import { LibsRegistry } from '../../src/loader'
import { loadTemplates } from '../../src/templates'
import { haystackDocs } from '../../src/types/hs-defs'

// FIXME: probably better ways to do this
const db = fs
	.readFile(path.join(process.cwd(), process.env.XETO_DOCS_AST_JSON ?? ''), {
		encoding: 'utf-8',
	})
	.then((json) => LibsRegistry.make(json))
const libs = process.env.XETO_DOCS_LIBS?.split(',')
const templates = loadTemplates()
const hsDocs = haystackDocs()

export default function PostPage(props: { ssg: string }) {
	const components = useMDXComponents()
	return (
		<div>
			{props.ssg && (
				<MDXRemote
					compiledSource={props.ssg}
					components={components}
					scope={undefined}
					frontmatter={undefined}
				/>
			)}
		</div>
	)
}

export const getStaticPaths: GetStaticPaths = async () => {
	const paths = [...(await db).libs.entries()].flatMap(([lib, { types }]) => {
		if (libs && !libs.includes(lib)) {
			return []
		}
		console.log(`Generating lib: ${lib}`)

		return [
			{ params: { lib, type: undefined } },
			...types.flatMap((t) => ({
				params: { lib, type: [t.fileName, t.typename] },
			})),
		]
	})

	return { paths, fallback: 'blocking' }
}

export async function getStaticProps(
	ctx: GetStaticPropsContext<{
		lib: string
		type?: string[]
	}>
) {
	const { lib, type } = ctx.params!

	const [libTemplate, typeTemplate] = await templates

	const realLib = (await db).libs.get(lib)

	const page = type
		? Eta.render(typeTemplate, {
				type: realLib?.types.find(
					(t) => t.fileName === type[0] && t.typename === type[1]
				),
				hsDocs: await hsDocs,
		  })
		: Eta.render(libTemplate, realLib ?? {})

	const mdxSource = await compileMdx(page, { defaultShowCopyCode: true })
	return {
		props: {
			ssg: mdxSource.result,
		},
	}
}
