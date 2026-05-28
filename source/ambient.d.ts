
// Augment the estree's definition of an AstNode to match Rollup's.
declare module 'estree' {
    export interface BaseNodeWithoutComments {
        start: number
        end: number
    }
}

declare global {

    /** `RegExpExecArray` for regexes using named capture groups. */
    type RegExpExecArrayWithGroups<T extends string> = Omit<RegExpExecArray, 'groups'> & {
        groups: { [key in T]?: string }
    }

    /** `RegExpExecArray`  for regexes using indices ('d' flag). */
    type RegExpExecArrayWithIndices = Omit<RegExpExecArray, 'indices'> & {
        indices: Array<[ number, number]>
    }

    /** `RegExpExecArray`  for regexes using both named capture groups and indices. */
    type RegExpExecArrayWithGroupsAndIndices<T extends string> = Omit<RegExpExecArray, 'groups' | 'indices'> & {
        indices: Array<[ number, number]> & {
            groups: { [key in T]?: [ number, number] }
        }
        groups: { [key in T]?: string }
    }

    /** `RegExpExecArray` for regexes using both named capture groups and indices. */
    type RegExpExecArrayWithIndicesAndGroups<T extends string> = RegExpExecArrayWithGroupsAndIndices<T>

    /** `RegExpMatchArray` for regexes using named capture groups. */
    type RegExpMatchArrayWithGroups<T extends string> = Omit<RegExpMatchArray, 'groups'> & {
        groups: { [key in T]?: string }
    }

    /** `RegExpMatchArray` for regexes using indices ('d' flag).. */
    type RegExpMatchArrayWithIndices = Omit<RegExpMatchArray, 'indices'> & {
        indices: Array<[ number, number]>
    }

    /** `RegExpMatchArray` for regexes using both named capture groups and indices. */
    type RegExpMatchArrayWithGroupsAndIndices<T extends string> = Omit<RegExpMatchArray, 'groups' | 'indices'> & {
        indices: Array<[ number, number]> & {
            groups: { [key in T]?: [ number, number] }
        }
        groups: { [key in T]?: string }
    }

    /** `RegExpMatchArray` for regexes using both named capture groups and indices. */
    type RegExpMatchArrayWithIndicesAndGroups<T extends string> = RegExpMatchArrayWithGroupsAndIndices<T>
}

export {}
