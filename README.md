# @septh/rollup-plugins-collection

> A collection of tiny useful plugins for your everyday Rollup.

## Usage

```sh
npm install -D @septh/rollup-plugins-collection
```

Then:

```js
import collection from '@septh/rollup-plugins-collection'
```

or

```js
import { enums, noComment, production } from '@septh/rollup-plugins-collection'
```

## Plugins therein

1. **ts-enums**: turns TypeScript `enum`'s into a tree-shakeable form.
    * Extracted from [libwin32](https://github.com/Septh/libwin32).
1. **no-comment**: removes residual comments in the bundle.
    * Extracted from [rollup-plugin-code-raker](https://github.com/Septh/rollup-plugin-code-raker).
1. **production**: strips `debugger` statements and `console.*` calls.
    * Extracted from [rollup-plugin-code-raker](https://github.com/Septh/rollup-plugin-code-raker).
1. More to come...
