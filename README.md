# @septh/rollup-plugins-collection

> A collection of tiny useful plugins for your everyday Rollup.

## Usage

```sh
npm install --save-dev @septh/rollup-plugins-collection
```

Then use the whole collection at once:

```js
import { defineConfig } from 'rollup'
import collection from '@septh/rollup-plugins-collection'

export default defineConfig({
    plugins: [
        collection({
            noComment: { /* no-comment options */ },
            production: { /* production options */ }
        })
    ]
})
```

or each plugin individually:

```js
import { defineConfig } from 'rollup'
import { enums, noComment, production } from '@septh/rollup-plugins-collection'

export default defineConfig({
    plugins: [
        enums(),
        noComment(/* no-comment options */),
        production(/* production options */)
    ]
})
```

## Plugins therein

### enums
Turns TypeScript's `enum`s into a tree-shakeable form (see comment in source code for details). Extracted from [libwin32](https://github.com/Septh/libwin32).
* The plugin has no options.

### no-comment
Removes residual comments in the bundle. Extracted from [rollup-plugin-code-raker](https://github.com/Septh/rollup-plugin-code-raker).
* Options:
```ts
interface NoCommentOptions {
    /** Keep license (`/*!`) comments? */
    keepLicences?: boolean

    /** Keep JSDoc/TSDoc (`/**`) comments? */
    keepDocs?: boolean

    /** Keep annotations (`__PURE__`, `__NO_SIDE_EFFECTS__`) comments? */
    keepAnnotations?: boolean
}
```

### production
Strips `debugger` statements and `console.*` calls. Extracted from [rollup-plugin-code-raker](https://github.com/Septh/rollup-plugin-code-raker).
* Options:
```ts
interface ProductionOptions {
    /** Keep all `console.*` calls, none, or only passed method names. */
    keepConsole?: boolean | string[]

    /** Keep `debugger` statements. */
    keepDebugger?: boolean
}
```


## License
MIT.
