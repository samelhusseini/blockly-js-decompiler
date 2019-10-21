/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Node demo using the JS decompiler.
 * @author samelh@google.com (Sam El-Husseini)
 */
'use strict';

var Blockly = require('blockly');
var decompile = require('blockly-js-decompiler');

var code = `
var count;

if (Math.pow(1)) {
  while(true) {
    for (count = 0; count <= 10; count += 0) {
    }
  }
} else if (true) {
  for (count = 11; count <= 12312; count += 0) {
  }
} else {
  for (count = 11; count <= 12312; count += 0) {
  }
}
`;

var workspace = new Blockly.Workspace();
decompile(workspace, code);

console.log(Blockly.JavaScript.workspaceToCode(workspace));