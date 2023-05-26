import nextra from 'nextra'
import { remarkMermaid } from 'remark-mermaid-nextra'
import plugin from './plugin/XetoMdxPlugin.js'
import defaults from './src/defaults.js'

const { BASE_URL } = defaults

const withNextra = nextra({
	theme: 'nextra-theme-docs',
	themeConfig: './theme.config.jsx',
	staticImage: true,
	defaultShowCopyCode: true,
	readingTime: true,
	mdxOptions: {
		remarkPlugins: [remarkMermaid, plugin.XetoMdxPlugin],
	},
})

export default withNextra({
	reactStrictMode: true,
	images: {
		unoptimized: true,
	},
	experimental: {
		serverComponentsExternalPackages: ['shiki', 'vscode-oniguruma'],
	},
	output: 'export',
	assetPrefix: BASE_URL,
	basePath: BASE_URL,
})
