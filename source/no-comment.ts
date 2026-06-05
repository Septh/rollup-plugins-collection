import MagicString from 'magic-string'
import { walk } from 'zimmerframe'
import type { Node as AstNode } from 'estree'
import type { Plugin } from 'rollup'
import { lineTerminators, spaces } from './lib/charcode.js'

export interface NoCommentOptions {
    /** Keep license (`/*!`) comments? */
    keepLicenses?: boolean | undefined
    /** Keep JSDoc/TSDoc (`/**`) comments? */
    keepDocs?: boolean | undefined
    /** Keep annotations (`__PURE__`, `__NO_SIDE_EFFECTS__`) comments? */
    keepAnnotations?: boolean | undefined
}

/** Removes residual comments in the bundle. */
export default function noComment({ keepLicenses = false, keepDocs = false, keepAnnotations = false }: NoCommentOptions = {}): Plugin {

    const commentsRx      = /(?<block>[/][*].*?[*][/])|(?<line>[/][/][^\n\r\u2028\u2029]*)/gsd
    const licenseStartRx  = /^[/][*][!][\s]/
    const docStartRx      = /^[/][*][*][\s]/
    const docLicenseTagRx = /\s@license\b/
    const annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    return {
        name: 'no-comment',

        renderChunk: {
            order: 'post',
            handler(code) {
                const ms = new MagicString(code += '\n;')
                let previousNode = { start: NaN, end: NaN } as AstNode
                walk(this.parse(code) as AstNode, null, {
                    _(node, context) {
                        if (node.start >= previousNode.start && node.end <= previousNode.end) {
                            if ((node.start - previousNode.start) > 1)
                                removeComments(ms, previousNode.start, node.start)
                        }
                        else if ((node.start - previousNode.end) > 1)
                            removeComments(ms, previousNode.end, node.start)

                        if (isEmptyBlock(node))
                            removeComments(ms, node.start, node.end)

                        previousNode = node
                        context.next()
                    }
                })

                ms.trimLines()

                let result = ms.toString()
                if (result === code)
                    return
                result = result.slice(0, -2)
                return { code: result, map: ms.generateMap() }
            }
        }
    }

    function isEmptyBlock(node: AstNode): boolean {
        const { type } = node
        return (
            ((type === 'BlockStatement' || type === 'Program' || type === 'StaticBlock') && node.body.length === 0)
            || (type === 'SwitchCase' && node.consequent.length === 0)
        )
    }

    function testComment(comment: string): boolean {
        if (docStartRx.test(comment))
            return docLicenseTagRx.test(comment) ? !keepLicenses : !keepDocs

        if (licenseStartRx.test(comment))
            return !keepLicenses

        if (annotationRx.test(comment))
            return !keepAnnotations

        // Meaningless comments are always removed
        return true
    }

    function removeComments(ms: MagicString, start: number, end: number): void {

        const text = ms.original.slice(start, end)
        const matches = Array.from(text.matchAll(commentsRx)) as RegExpExecArrayWithGroupsAndIndices<'block' | 'line'>[]

        let result = text
        for (let i = matches.length - 1; i >= 0; i--) {
            const { indices, groups } = matches[i]

            let [ start, end ] = groups.line ? indices.groups.line!
                : groups.block && testComment(groups.block) ? indices.groups.block!
                : [ -1, -1 ]
            if (start < 0)
                continue

            let before = start
            while (before > 0 && spaces.has(text.charCodeAt(before - 1)))
                --before

            let after = end
            while (after < result.length && spaces.has(text.charCodeAt(after)))
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

            result = result.slice(0, start) + result.slice(end)
        }

        result = result.replaceAll(/[\n\r\u2028\u2029]{2,}/g, '\n')
        if (result !== text)
            ms.update(start, end, result)
    }
}
