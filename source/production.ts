import MagicString from 'magic-string'
import { walk } from 'zimmerframe'
import type { Node as AstNode } from "estree"
import type { Plugin } from 'rollup'
import { spaces, lineTerminators } from './lib/charcode.js'

export interface ProductionOptions {
    /** Keep all `console.*` calls, none, or only passed method names. */
    keepConsole?: boolean | string[] | undefined
    /** Keep `debugger` statements. */
    keepDebugger?: boolean | undefined
}

/** Strips `debugger` statements and `console.*` calls. */
export default function production({ keepConsole = false, keepDebugger = false }: ProductionOptions = {}): Plugin {

    const consoleMethods = Object.keys(console).filter(name => typeof console[name as keyof Console] === 'function')
    const testConsoleCall = (
        typeof keepConsole === 'boolean' ? () => !keepConsole
            : Array.isArray(keepConsole) ? createFilter(consoleMethods, keepConsole)
            : () => { throw new TypeError("Invalid value for 'keepConsole' option") }
    )

    return {
        name: 'production',

        transform: {
            order: 'post',
            handler(code) {
                const ms = new MagicString(code)
                walk(this.parse(code) as AstNode, null, {
                    DebuggerStatement(node, context) {
                        if (!keepDebugger)
                            removeStatementNode(ms, node, context.path.at(-1)!)
                    },

                    CallExpression(node, context) {
                        const { callee } = node
                        if (
                            callee.type === 'MemberExpression'
                            && callee.object.type === 'Identifier'
                            && callee.object.name === 'console'
                            && callee.property.type === 'Identifier'
                            && testConsoleCall(callee.property.name)
                        ) {
                            removeExpressionNode(ms, node, context.path.at(-1)!, context.path.at(-2)!)
                        }
                    }
                })

                const result = ms.toString()
                return result === code ? null : { code: result, map: ms.generateMap() }
            }
        }
    }

    function removeStatementNode(ms: MagicString, node: AstNode, parent: AstNode): void {
        if (parent.type === 'BlockStatement' || parent.type === 'Program' || parent.type === 'StaticBlock' || parent.type === 'SwitchCase') {
            const text = ms.original
            let { start, end } = node

            let before = start
            while (before > 0 && spaces.has(text.charCodeAt(before - 1)))
                --before

            let after = end
            while (after < text.length && spaces.has(text.charCodeAt(after)))
                ++after

            if (lineTerminators.has(text.charCodeAt(after))) {
                start = before
                end = after
                if (before === 0 || lineTerminators.has(text.charCodeAt(before - 1)))
                    ++end
            }
            else if (after >= end)
                end = after
            else
                start = before

            ms.remove(start, end)
        }
        else ms.update(node.start, node.end, ';')
    }

    function removeExpressionNode(ms: MagicString, node: AstNode, parent: AstNode, grandParent: AstNode): void {
        if (parent.type === 'ExpressionStatement')
            return removeStatementNode(ms, parent, grandParent)
        ms.update(node.start, node.end, '(void 0)')
    }

    function createFilter(include: string[], exclude: string[]) {
        const isIncluded = (name: string) => include.length > 0 && include.includes(name)
        const isExcluded = (name: string) => exclude.length > 0 && exclude.includes(name)
        return function filter(name: string) {
            return isIncluded(name) && !isExcluded(name)
        }
    }
}
