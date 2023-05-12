import nextra from 'nextra'

import defaults from './src/defaults.js'
const { BASE_URL } = defaults

const withNextra = nextra({
	theme: 'nextra-theme-docs',
	themeConfig: './theme.config.jsx',
	staticImage: true,
	defaultShowCopyCode: true,
	readingTime: true,
})

export default withNextra({
	reactStrictMode: true,
	images: {
		unoptimized: true,
	},
	output: 'export',
	assetPrefix: BASE_URL,
	basePath: BASE_URL,
})
