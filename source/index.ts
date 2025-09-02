import type { Plugin } from 'rollup'
import { enums } from './ts-enums.js'
import { noComment, type NoCommentsOptions } from './no-comment.js'
import { noDebug, type NoDebugOptions } from './no-debug.js'

export interface PluginOptions {
    comments?: NoCommentsOptions | undefined
    debug?: NoDebugOptions | undefined
}

export default function plugins(options: PluginOptions = {}): Plugin[] {
    return [ enums(), noComment(options.comments), noDebug(options.debug) ]
}

export {
    enums,
    noComment, type NoCommentsOptions,
    noDebug, type NoDebugOptions
}
