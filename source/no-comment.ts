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

    const commentsRx      = /(?<line>[/][/][^\n\r\u2028\u2029]*)|(?<block>[/][*].*?[*][/])/gsd
    const licenseStartRx  = /^\/\*\![ \r\n\u2028\u2029]/    // /*!<space or line terminator>
    const docStartRx      = /^\/\*\*[ \r\n\u2028\u2029]/    // /**<space or line terminator>
    const docLicenseTagRx = /\s@license\b/
    const annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    return {
        name: 'no-comment',

        renderChunk(code, chunk) {
            const shouldRemove = (comment: string) => !(
                licenseStartRx.test(comment) ? keepLicenses
                    : docStartRx.test(comment) ?
                        docLicenseTagRx.test(comment) ? keepLicenses : keepDocs
                    : annotationRx.test(comment) ? keepAnnotations
                    : false
            )

            const exportless = chunk.exports.length === 0
            if (exportless)
                code += '\n;'
            const ms = new MagicString(code)

            let previous = { start: NaN, end: NaN } as AstNode
            walk(this.parse(code) as AstNode, null, {
                _(node, context) {
                    if (node.start >= previous.start && node.end <= previous.end) {
                        // `node` is the first child of `prev`
                        if ((node.start - previous.start) > 1) {
                            // And there is text before it.
                            removeCommentsBetweenNodes(ms, previous.start, node.start, shouldRemove)
                        }
                    }
                    else if ((node.start - previous.end) > 1) {
                        // `node` immediately follows `prev` and there is text between them.
                        removeCommentsBetweenNodes(ms, previous.end, node.start, shouldRemove)
                    }
                    previous = node
                    context.next()
                }
            })

            let result = ms.toString()
            if (exportless)
                result = result.slice(0, -2)
            return result === code ? null : { code: result, map: ms.generateMap() }
        }
    }

    function removeCommentsBetweenNodes(ms: MagicString, start: number, end: number, shouldRemoveComment: (comment: string) => boolean): void {

        // Find all comments between `start` and `end` in the original text.
        const text = ms.original.slice(start, end)
        const matches = Array.from(text.matchAll(commentsRx)) as RegExpExecArrayWithGroupsAndIndices<'line' | 'block'>[]

        // Proceed from "bottom" to "top" of text so that we can cut into the result
        // without re-offsetting all comments "below" the current one.
        let result = text
        for (let i = matches.length - 1; i >= 0; i--) {
            const { indices, groups } = matches[i]
            if (groups.line) {
                let [ from, to ] = indices.groups.line!

                // Back to the first non-space character before the comment.
                while (from > 0 && spaces.has(result.charCodeAt(from - 1)))
                    --from

                // const toRemove = text.slice(from, to)
                // result = result.replace(toRemove, '')
                result = result.slice(0, from) + result.slice(to)
            }
            else if (groups.block && shouldRemoveComment(groups.block)) {
                let [ from, to ] = indices.groups.block!

                // Back to the first non-space character before the comment.
                let before = from
                while (before > 0 && spaces.has(result.charCodeAt(before - 1)))
                    --before

                // Forward to the first non-space character after the comment.
                let after = to
                while (after < result.length && spaces.has(result.charCodeAt(after)))
                    ++after

                if (lineTerminators.has(result.charCodeAt(after))) {
                    from = before
                    to = after
                }
                else if (after > to)
                    to = after
                else
                    from = before

                // const toRemove = text.slice(from, to)
                // result = result.replace(toRemove, '')
                result = result.slice(0, from) + result.slice(to)
            }
        }

        // Remove empty lines.
        result = result.replaceAll(/[\n\r\u2028\u2029]{2,}/g, '\n')
        if (result.length === 1 && lineTerminators.has(result.charCodeAt(0)))
            ms.remove(start, end)
        else if (result !== text)
            ms.update(start, end, result)
    }
}
