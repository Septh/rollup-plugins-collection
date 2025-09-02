import { Raker } from './lib/raker.js'
import type { Plugin } from 'rollup'

interface NoCommentsOptions {
    licences?: boolean
    docs?: boolean
    annotations?: boolean
}

/** Removes residual comments in the bundle. */
export function noComments({ licences = false, docs = false, annotations = false }: NoCommentsOptions): Plugin {

    const licenseStartRx  = /^\/\*\![ \r\n\u2028\u2029]/    // /*!<space or line terminator>
    const docStartRx      = /^\/\*\*[ \r\n\u2028\u2029]/    // /**<space or line terminator>
    const docLicenseTagRx = /\s@license\b/
    const annotationRx    = /[@#]__(?:PURE|NO_SIDE_EFFECTS)__/

    return {
        name: 'no-comments',

        renderChunk(code) {
            const raker = new Raker(code)
            raker.rakeComments(comment => Boolean(
                licenseStartRx.test(comment) ? licences
                : docStartRx.test(comment) ? (
                    docLicenseTagRx.test(comment) ? licences : docs
                )
                : annotationRx.test(comment) ? annotations
                : true // Meaningless comments are always removed
            ))

            return raker.hasChanged()
                ? { code: raker.toString(), map: raker.generateMap() }
                : null
        }
    }
}
