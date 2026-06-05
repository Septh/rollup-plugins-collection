import type { Plugin } from 'rollup'
import enums from './enums.js'
import noComment, { type NoCommentOptions } from './no-comment.js'
import production, { type ProductionOptions } from './production.js'

export interface CollectionOptions {
    comments?: NoCommentOptions | undefined
    production?: ProductionOptions | undefined
}

/**
 * All plugins in the collection with only one import. Currently:
 * - `enums()`
 * - `noComment(options.comment)`
 * - `production(options.production)`
 *
 * You may also only choose the plugins you need by importing them by their name
 * rather than the default export.
 */
export default function collection(options?: CollectionOptions | undefined): Plugin[] {
    return [ enums(), noComment(options?.comments), production(options?.production) ]
}

export {
    enums,
    noComment, type NoCommentOptions,
    production, type ProductionOptions
}
