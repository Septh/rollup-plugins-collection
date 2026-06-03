import { regex } from 'regex'
import MagicString from 'magic-string'
import type { Plugin } from 'rollup'

/**
 * Turns TypeScript enums into a tree-shakeable form -- the same as esbuild's.
 *
 * For example, consider this TypeScript code:
 * ````ts
 * export enum X { a, b=10, c }
 * ````
 *
 * This is what tsc emits:
 * ````ts
 * export var X;
 * (function (X) {
 *   X[X["a"] = 0] = "a";
 *   X[X["b"] = 10] = "b";
 *   X[X["c"] = 11] = "c";
 * })(X || (X = {}));
 * ````
 *
 * And this is how this plugin transforms the above:
 * ````ts
 * export var X = ((X) => {
 *   X[X["a"] = 0] = "a";
 *   X[X["b"] = 10] = "b";
 *   X[X["c"] = 11] = "c";
 *   return X;
 * })(X || {});
 * ````
 *
 * Notes:
 * - The IIFE is annotated as PURE.
 * - This works for enums, const enums, and even namespaces!
 * - The [regex](https://www.npmjs.com/package/regex) package is absolutely AWESOME!
 */
export default function enums(): Plugin {

    // https://regex101.com/r/1nyPC3/8
    const enumRx = regex('gsd')`
        (?<intro>
          \b(?<export>export\s)?var\s(?<name>[^;]+);\n   # export var XX;\n
          \s*\(function\s\(\k<name>\)\s\{                # (function (XX) {
        )

        # Skip everything up to the outro.
        .*

        (?<outro>
          \}\)\(\k<name>\s\|\|\s\(\k<name>\s=\s\{\}\)\); # })(XX || XX={});
        )
    `

    return {
        name: 'enums',

        transform: {
            order: 'post',
            handler(code) {
                const ms = new MagicString(code)
                const indent = ms.getIndentString()
                for (const { groups, indices } of code.matchAll(enumRx) as RegExpStringIterator<RegExpExecArrayWithGroupsAndIndices<'intro' | 'export' | 'name' | 'outro'>>) {
                    const export_ = groups.export ?? ''
                    const varName = groups.name

                    ms.update(indices.groups.intro![0], indices.groups.intro![1], `${export_}var ${varName} = /*#__PURE__*/ ((${varName}) => {`)
                    ms.update(indices.groups.outro![0], indices.groups.outro![1], `${indent}return ${varName};\n})(${varName} || {});`)
                }

                const result = ms.toString()
                return result === code ? null : { code: result, map: ms.generateMap() }
            }
        }
    }
}
