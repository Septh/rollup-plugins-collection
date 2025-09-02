
// Augment the estree-walker's definition of an AstNode to match Rollup's.
declare module 'estree' {
    export interface BaseNodeWithoutComments {
        start: number
        end: number
    }
}

export {}
