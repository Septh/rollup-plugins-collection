import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import type { Plugin } from 'rollup'

export interface ProductionOptions {
    /** Keep all `console.*` calls, none, or only passed method names. */
    keepConsole?: boolean | string[]
    /** Keep `debugger` statements. */
    keepDebugger?: boolean
}

/** Strips `debugger` statements and `console.*` calls. */
export function production({ keepConsole = false, keepDebugger = false }: ProductionOptions = {}): Plugin {

    const allConsoleMethods = Object.entries(console).reduce((result, [ name, prop ]) => {
        if (typeof prop === 'function' && typeof name === 'string')
            result.push(name)
        return result
    }, [] as string[])

    const shouldRemoveConsoleCall: (method: string) => boolean = (
        typeof keepConsole === 'boolean'
            ? () => !keepConsole
            : createFilter(allConsoleMethods, keepConsole)
    )

    return {
        name: 'strip',

        transform(code) {
            const ms = new MagicString(code)

            walk(this.parse(code), {
                // NB: inside this block, `this` is the WalkerContext
                enter(node, parent) {
                    const { type, start, end } = node
                    if (type === 'DebuggerStatement' && !keepDebugger) {
                        ms.remove(start, end)
                        this.skip()
                    }
                    else if (type === 'CallExpression') {
                        const { callee } = node
                        if (
                            callee.type === 'MemberExpression'
                            && callee.object.type === 'Identifier'
                            && callee.object.name === 'console'
                            && callee.property.type === 'Identifier'
                            && shouldRemoveConsoleCall(callee.property.name)
                        ) {
                            switch (parent!.type) {
                                case 'Program':
                                case 'BlockStatement':
                                case 'ExpressionStatement':
                                case 'StaticBlock':
                                    ms.remove(start, end)
                                    break

                                default:
                                    ms.overwrite(start, end, '(void 0)')
                                    break
                            }
                            this.skip()
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
