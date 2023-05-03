import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
	input: 'build/main.js',
	output: [
		{
			file: 'dist/index.es.js',
			format: 'es',
		},
		{
			file: 'dist/index.js',
			format: 'commonjs',
		},
	],
	plugins: [resolve({}), commonjs({})],
}
