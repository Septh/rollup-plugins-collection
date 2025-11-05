import type { Plugin } from 'rollup'
import enums from './enums.js'
import noComment, { type NoCommentOptions } from './no-comment.js'
import production, { type ProductionOptions } from './production.js'

export interface CollectionOptions {
    comments?: NoCommentOptions | undefined
    debug?: ProductionOptions | undefined
}

export default function collection(options: CollectionOptions = {}): Plugin[] {
    return [ enums(), noComment(options.comments), production(options.debug) ]
}

export {
    enums,
    noComment, type NoCommentOptions,
    production, type ProductionOptions
}
