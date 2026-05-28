import MagicString from 'magic-string'
import { walk } from 'zimmerframe'
import type { Node } from "estree"
import type { Plugin } from 'rollup'

export interface ProductionOptions {
    /** Keep all `console.*` calls, none, or only passed method names. */
    keepConsole?: boolean | string[] | undefined
    /** Keep `debugger` statements. */
    keepDebugger?: boolean | undefined
}

/** Strips `debugger` statements and `console.*` calls. */
export default function production({ keepConsole = false, keepDebugger = false }: ProductionOptions = {}): Plugin {

    const consoleMethods = Object.keys(console).filter(name => typeof console[name as keyof Console] === 'function')
    const shouldRemoveConsoleCall: (method: string) => boolean = (
        typeof keepConsole === 'boolean'
            ? () => !keepConsole
            : createFilter(consoleMethods, keepConsole)
    )

    return {
        name: 'production',

        transform(code) {
            const ms = new MagicString(code)

            walk(this.parse(code) as Node, {}, {
                DebuggerStatement(node) {
                    if (!keepDebugger)
                        ms.remove(node.start, node.end)
                },

                CallExpression(node, context) {
                    const { callee } = node
                    if (
                        callee.type === 'MemberExpression'
                        && callee.object.type === 'Identifier'
                        && callee.object.name === 'console'
                        && callee.property.type === 'Identifier'
                        && shouldRemoveConsoleCall(callee.property.name)
                    ) {
                        switch (context.path.at(-1)?.type) {
                            case 'Program':
                            case 'BlockStatement':
                            case 'ExpressionStatement':
                            case 'StaticBlock':
                                ms.remove(node.start, node.end)
                                break

                            default:
                                ms.overwrite(node.start, node.end, '(void 0)')
                                break
                        }
                    }
                }
            })

            return ms.hasChanged()
                ? { code: ms.toString(), map: ms.generateMap() }
                : null
        }
    }

    function createFilter(include: string[], exclude: string[]) {
        const isIncluded = (name: string) => include.length > 0 && include.includes(name)
        const isExcluded = (name: string) => exclude.length > 0 && exclude.includes(name)
        return function filter(name: string) {
            return isIncluded(name) && !isExcluded(name)
        }
    }
}
