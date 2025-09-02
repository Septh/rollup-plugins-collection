import { Raker } from './lib/raker.js'
import type { Plugin } from 'rollup'

export interface NoCommentsOptions {
    /** Keep license (`/*!`) comments? */
    keepLicences?: boolean | undefined
    /** Keep JSDoc/TSDoc (`/**`) comments? */
    keepDocs?: boolean | undefined
    /** Keep annotations (`__PURE__`, `__NO_SIDE_EFFECTS__`) comments? */
    keepAnnotations?: boolean | undefined
}

/** Removes residual comments in the bundle. */
export function noComment({ keepLicences = false, keepDocs = false, keepAnnotations = false }: NoCommentsOptions = {}): Plugin {

    const licenseStartRx  = /^\/\*\![ \r\n\u2028\u2029]/    // /*!<space or line terminator>
    const docStartRx      = /^\/\*\*[ \r\n\u2028\u2029]/    // /**<space or line terminator>
    const docLicenseTagRx = /\s@license\b/
    const annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    const removeLicenses = !keepLicences
    const removeDocs = !keepDocs
    const removeAnnotations = !keepAnnotations

    return {
        name: 'no-comments',

        renderChunk(code) {
            const raker = new Raker(code)
            raker.rakeComments(comment => Boolean(
                licenseStartRx.test(comment) ? removeLicenses
                : docStartRx.test(comment) ? (
                    docLicenseTagRx.test(comment) ? removeLicenses : removeDocs
                )
                : annotationRx.test(comment) ? removeAnnotations
                : true // Meaningless comments are always removed
            ))

            return raker.hasChanged()
                ? { code: raker.toString(), map: raker.generateMap() }
                : null
        }
    }
}
