(self["webpackJsonp"] = self["webpackJsonp"] || []).push([[44],{

/***/ "./node_modules/monaco-editor/esm/vs/basic-languages/scheme/scheme.js":
/*!****************************************************************************!*\
  !*** ./node_modules/monaco-editor/esm/vs/basic-languages/scheme/scheme.js ***!
  \****************************************************************************/
/*! exports provided: conf, language */
/*! ModuleConcatenation bailout: Module is referenced from these modules with unsupported syntax: ./node_modules/monaco-editor/esm/vs/basic-languages/scheme/scheme.contribution.js (referenced with import()) */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"conf\", function() { return conf; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"language\", function() { return language; });\n/*---------------------------------------------------------------------------------------------\n *  Copyright (c) Microsoft Corporation. All rights reserved.\n *  Licensed under the MIT License. See License.txt in the project root for license information.\n *--------------------------------------------------------------------------------------------*/\n\nvar conf = {\n    comments: {\n        lineComment: ';',\n        blockComment: ['#|', '|#'],\n    },\n    brackets: [['(', ')'], ['{', '}'], ['[', ']']],\n    autoClosingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n    ],\n    surroundingPairs: [\n        { open: '{', close: '}' },\n        { open: '[', close: ']' },\n        { open: '(', close: ')' },\n        { open: '\"', close: '\"' },\n    ],\n};\nvar language = {\n    defaultToken: '',\n    ignoreCase: true,\n    tokenPostfix: '.scheme',\n    brackets: [\n        { open: '(', close: ')', token: 'delimiter.parenthesis' },\n        { open: '{', close: '}', token: 'delimiter.curly' },\n        { open: '[', close: ']', token: 'delimiter.square' },\n    ],\n    keywords: [\n        'case',\n        'do',\n        'let',\n        'loop',\n        'if',\n        'else',\n        'when',\n        'cons',\n        'car',\n        'cdr',\n        'cond',\n        'lambda',\n        'lambda*',\n        'syntax-rules',\n        'format',\n        'set!',\n        'quote',\n        'eval',\n        'append',\n        'list',\n        'list?',\n        'member?',\n        'load',\n    ],\n    constants: ['#t', '#f'],\n    operators: ['eq?', 'eqv?', 'equal?', 'and', 'or', 'not', 'null?'],\n    tokenizer: {\n        root: [\n            [/#[xXoObB][0-9a-fA-F]+/, 'number.hex'],\n            [/[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?/, 'number.float'],\n            [\n                /(?:\\b(?:(define|define-syntax|define-macro))\\b)(\\s+)((?:\\w|\\-|\\!|\\?)*)/,\n                ['keyword', 'white', 'variable'],\n            ],\n            { include: '@whitespace' },\n            { include: '@strings' },\n            [\n                /[a-zA-Z_#][a-zA-Z0-9_\\-\\?\\!\\*]*/,\n                {\n                    cases: {\n                        '@keywords': 'keyword',\n                        '@constants': 'constant',\n                        '@operators': 'operators',\n                        '@default': 'identifier',\n                    },\n                },\n            ],\n        ],\n        comment: [\n            [/[^\\|#]+/, 'comment'],\n            [/#\\|/, 'comment', '@push'],\n            [/\\|#/, 'comment', '@pop'],\n            [/[\\|#]/, 'comment'],\n        ],\n        whitespace: [\n            [/[ \\t\\r\\n]+/, 'white'],\n            [/#\\|/, 'comment', '@comment'],\n            [/;.*$/, 'comment'],\n        ],\n        strings: [\n            [/\"$/, 'string', '@popall'],\n            [/\"(?=.)/, 'string', '@multiLineString'],\n        ],\n        multiLineString: [\n            [/[^\\\\\"]+$/, 'string', '@popall'],\n            [/[^\\\\\"]+/, 'string'],\n            [/\\\\./, 'string.escape'],\n            [/\"/, 'string', '@popall'],\n            [/\\\\$/, 'string']\n        ],\n    },\n};\n\n\n//# sourceURL=webpack:///./node_modules/monaco-editor/esm/vs/basic-languages/scheme/scheme.js?");

/***/ })

}]);