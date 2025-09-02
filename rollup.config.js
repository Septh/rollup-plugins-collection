import { defineConfig } from 'rollup'
import nodeExternals from 'rollup-plugin-node-externals'
import nodeResolve_ from '@rollup/plugin-node-resolve'
import commonJS_ from '@rollup/plugin-commonjs'

/**
 * Workaround for the wrong typings in all rollup plugins
 * (see https://github.com/rollup/plugins/issues/1541#issuecomment-1837153165)
 * @template T
 * @param {{ default: T }} plugin
 */
const fixRollupPluginTypings = (plugin) => /** @type {T} */ (plugin)
const nodeResolve = fixRollupPluginTypings(nodeResolve_)
const commonJS = fixRollupPluginTypings(commonJS_)

export default defineConfig({
    input: [
        './out/enums.js',
        './out/no-comment.js',
        './out/rake.js',
    ],
    output: {
        dir: './dist',
        format: 'esm',
        generatedCode: 'es2015',
        sourcemap: 'hidden',
        sourcemapExcludeSources: true,
        minifyInternalExports: false,
    },
    plugins: [
        nodeExternals(),
        nodeResolve(),
        commonJS(),
    ]
})
