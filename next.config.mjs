import nextra from 'nextra'

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
	assetPrefix: '/',
})
