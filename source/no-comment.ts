import MagicString from 'magic-string'
import { walk } from 'zimmerframe'
import type { Node as AstNode } from 'estree'
import type { Plugin } from 'rollup'
import { lineTerminators, space } from './lib/charcode.js'

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

    const licenseStartRx  = /^\/\*\![ \r\n\u2028\u2029]/    // /*!<space or line terminator>
    const docStartRx      = /^\/\*\*[ \r\n\u2028\u2029]/    // /**<space or line terminator>
    const docLicenseTagRx = /\s@license\b/
    const annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    return {
        name: 'no-comment',

        renderChunk(code) {
            const ms = new MagicString(code)

            const shouldRemove = (comment: string) => !(
                licenseStartRx.test(comment) ? keepLicenses
                    : docStartRx.test(comment) ?
                        docLicenseTagRx.test(comment) ? keepLicenses : keepDocs
                    : annotationRx.test(comment) ? keepAnnotations
                    : false
            )

            let prev = { start: NaN, end: NaN } as AstNode
            walk(this.parse(code) as AstNode, {}, {
                _(node, context) {
                    if (node.start >= prev.start && node.end <= prev.end) {
                        // `node` is the first child of `prev`
                        if ((node.start - prev.start) > 1) {
                            // And there is text before it.
                            scanTextBetweenNodes(ms, prev.start, node.start, shouldRemove)
                        }
                    }
                    else if ((node.start - prev.end) > 1) {
                        // `node` immediately follows `prev` and there is text between them.
                        scanTextBetweenNodes(ms, prev.end, node.start, shouldRemove)
                    }
                    prev = node
                    context.next()
                }
            })

            return ms.hasChanged()
                ? { code: ms.toString(), map: ms.generateMap() }
                : null
        }
    }

    function scanTextBetweenNodes(ms: MagicString, from: number, to: number, shouldRemoveComment: (comment: string) => boolean): void {
        const re = /(?<line>[/][/][^\n]*)|(?<block>[/][*].*?[*][/])/gsd

        const text = ms.original.slice(from, to)
        let result = text

        const matches = Array.from(text.matchAll(re)) as Array<RegExpExecArrayWithGroupsAndIndices<'line' | 'block'>>
        if (matches.length > 0) {
            for (let i = matches.length - 1; i >= 0; i--) {
                const { indices, groups } = matches[i]
                if (groups.line) {
                    let [ start, end ] = indices.groups.line!

                    while (start > 0 && space.has(text.charCodeAt(start - 1)))
                        --start

                    result = result.slice(0, start) + result.slice(end)
                }
                else if (groups.block && shouldRemoveComment(groups.block)) {
                    let [ start, end ] = indices.groups.block!

                    let before = start
                    while (before > 0 && space.has(text.charCodeAt(before - 1)))
                        --before

                    let after = end
                    while (after < text.length && space.has(text.charCodeAt(after)))
                        ++after

                    if (lineTerminators.has(text.charCodeAt(after))) {
                        start = before
                        end = ++after
                    }
                    else if (before === 0 || !lineTerminators.has(text.charCodeAt(before - 1)))
                        start = before
                    else
                        end = after

                    result = result.slice(0, start) + result.slice(end)
                }
            }
        }

        result = result.replaceAll(/\n+/g, '\n')
        if (result === '\n')
            result = ''
        if (result !== text)
            ms.update(from, to, result)
    }
}
