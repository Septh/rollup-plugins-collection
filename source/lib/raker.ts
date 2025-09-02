import MagicString from 'magic-string'
import type { AstNode } from 'rollup'
import { CharCode, whitespace, lineTerminators } from './charcode.js'

export class Raker extends MagicString {

    public rakeAstNode(node: AstNode, parent: AstNode): Raker {
        let { start, end } = node
        switch (parent.type) {
            case 'Program':
            case 'BlockStatement':
            case 'ExpressionStatement':
            case 'StaticBlock':
                this.remove(start, end)
                break

            case 'ArrowFunctionExpression':
                this.overwrite(start, end, '{}')
                break

            default:
                this.overwrite(start, end, '(void 0)')
                break
        }
        return this
    }

    public rakeComments(shouldRemove: (comment: string) => boolean): Raker {
        const self = this,
              { original: code } = self,
              end = code.length
        return scan(0, false), this

        function scan(pos: number, inTemplate: boolean): number {
            let braces = 0,
                char: number,
                start: number;
            while (pos < end) {
                switch (char = code.charCodeAt(pos)) {

                    // Handle comments.
                    case CharCode.slash:
                        start = pos
                        char = code.charCodeAt(++pos)
                        if (char === CharCode.slash) {

                            // Go back to the first non-whitespace character before the comment.
                            while (start > 0 && whitespace.has(code.charCodeAt(start - 1)))
                                --start

                            // Advance to the end of the comment's body.
                            while (pos < end && !lineTerminators.has(code.charCodeAt(pos)))
                                ++pos

                            // Include the line terminator if there is no code before the comment.
                            if (start === 0 || lineTerminators.has(code.charCodeAt(start - 1))) {
                                ++pos
                                if (code.charCodeAt(pos) === CharCode.lineFeed && code.charCodeAt(pos - 1) === CharCode.carriageReturn)
                                    ++pos
                            }

                            // Unconditionally remove line comments.
                            self.remove(start, pos)
                        }
                        else if (char === CharCode.asterisk) {

                            // Get the comment's body.
                            while (++pos < end && (code.charCodeAt(pos) !== CharCode.slash || code.charCodeAt(pos - 1) !== CharCode.asterisk));
                            const comment = code.slice(start, ++pos)

                            // Remove it?
                            if (shouldRemove(comment)) {

                                // Find the first non-whitespace character before the comment.
                                let before = start
                                while (before > 0 && whitespace.has(code.charCodeAt(before - 1)))
                                    --before

                                // If the comment ends a line and there is no code before the comment, include the line terminator.
                                // Otherwise, only include all whitespace before the comment, unless it's indentation.
                                if (lineTerminators.has(code.charCodeAt(pos))) {
                                    if (before > 0 && lineTerminators.has(code.charCodeAt(before - 1))) {
                                        ++pos
                                        if (code.charCodeAt(pos) === CharCode.lineFeed && code.charCodeAt(pos - 1) === CharCode.carriageReturn)
                                            ++pos
                                    }

                                    // Also include the whitespace before the comment.
                                    start = before
                                }
                                else if (before === 0 || !lineTerminators.has(code.charCodeAt(before - 1)))
                                    start = before

                                self.remove(start, pos)
                            }
                        }
                        break

                    // Skip strings altogether so we don't process their content inadvertently.
                    case CharCode.quotationMark:
                    case CharCode.apostrophe:
                        while (++pos < end) {
                            if (code.charCodeAt(pos) === CharCode.backslash) {
                                ++pos
                                continue
                            }
                            if (code.charCodeAt(pos) === char) {
                                ++pos
                                break
                            }
                        }
                        break

                    // Entering a template literal.
                    // If substitution slices (anything between '${' and '}') are found,
                    // we recursively call ourselves for easy handling of their contents.
                    case CharCode.backtick:
                        while (++pos < end) {
                            if (code.charCodeAt(pos) === CharCode.backslash) {
                                ++pos
                                continue
                            }
                            if (code.charCodeAt(pos) === CharCode.backtick) {
                                ++pos
                                break
                            }
                            if (code.charCodeAt(pos) === CharCode.dollar && code.charCodeAt(pos + 1) === CharCode.openBrace) {
                                pos = scan(pos + 1, true) - 1
                            }
                        }
                        break

                    // When scanning inside a template literal substitution slice, we track brace opening/closing
                    // so as not to mistake a closing brace for the end of that slice.
                    case CharCode.openBrace:
                        ++pos
                        ++braces
                        break

                    case CharCode.closeBrace:
                        ++pos
                        if (--braces === 0 && inTemplate)
                            return pos
                        break

                    default:
                        ++pos
                        if (lineTerminators.has(char)) {
                            if (pos < end && char === CharCode.carriageReturn && code.charCodeAt(pos) === CharCode.lineFeed)
                                ++pos

                            // Remove empty lines.
                            start = pos
                            while (pos < end && lineTerminators.has(code.charCodeAt(pos)))
                                ++pos
                            if (pos > start)
                                self.remove(start, pos)
                        }
                        break
                }
            }
            return pos
        }
    }
}
