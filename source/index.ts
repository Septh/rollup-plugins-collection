import type { Plugin } from 'rollup'
import { enums } from './ts-enums.js'
import { noComment, type NoCommentsOptions } from './no-comment.js'
import { production, type ProductionOptions } from './production.js'

export interface PluginOptions {
    comments?: NoCommentsOptions | undefined
    debug?: ProductionOptions | undefined
}

export default function plugins(options: PluginOptions = {}): Plugin[] {
    return [ enums(), noComment(options.comments), production(options.debug) ]
}

export {
    enums,
    noComment, type NoCommentsOptions,
    production, type ProductionOptions
}
