# blockly-js-decompiler

Javascript to Blockly decompiler.


## Installation

```bash
npm install blockly-js-decompiler
```

## Usage

```js
import decompile from 'blockly-js-decompiler'

decompile(workspace, code);

```

## How it works

This decompiler works in two steps. First it uses the TypeScript compiler to
create an AST from the JavaScript code.
Once we have an AST, we're able to traverse the AST, creating Blockly blocks
along the way.

## License

Apache 2.0
