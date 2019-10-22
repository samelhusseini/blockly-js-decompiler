# blockly-js-decompiler

A Javascript to Blockly decompiler.

Note: This decompiler is not complete, and is intended as a showcase of how to
use decompile JavaScript code to Blockly blocks.

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
