import { walk } from 'estree-walker'
import { Raker } from './lib/raker.js'
import type { Plugin } from 'rollup'

export interface StripOptions {
    /** Keep all `console.*` calls, none, or only passed method names. */
    keepConsole?: boolean | string[]
    /** Keep `debugger` statements. */
    keepDebugger?: boolean
}

/** Strips console.* calls and debugger statements. */
export function strip({ keepConsole = false, keepDebugger = false }: StripOptions = {}): Plugin {

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

            const raker = new Raker(code)
            walk(this.parse(code), {
                // NB: inside this block, `this` is the WalkerContext
                enter(node, parent) {
                    if (node.type === 'DebuggerStatement' && !keepDebugger) {
                        raker.rakeAstNode(node, parent!)
                        this.skip()
                    }
                    else if (node.type === 'CallExpression') {
                        const { callee } = node
                        if (
                            callee.type === 'MemberExpression'
                            && callee.object.type === 'Identifier'
                            && callee.object.name === 'console'
                            && callee.property.type === 'Identifier'
                            && shouldRemoveConsoleCall(callee.property.name)
                        ) {
                            raker.rakeAstNode(node, parent!)
                            this.skip()
                        }
                    }
                }
            })

            return raker.hasChanged()
                ? { code: raker.toString(), map: raker.generateMap() }
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
