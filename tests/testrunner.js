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
 * @fileoverview Test runner for the JS decompiler.
 * @author samelh@google.com (Sam El-Husseini)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const Blockly = require('blockly');
const decompile = require('blockly-js-decompiler');

const codeDirectory = 'code/';
const blocksDirectory = 'blocks/';

const codeFiles = fs.readdirSync(codeDirectory);
const blockFiles = fs.readdirSync(blocksDirectory);

let failedTests = 0;

codeFiles.forEach(codeFile => {
  const fileName = codeFile.substr(0, codeFile.indexOf('.js'));
  const blockFileIndex = blockFiles.indexOf(fileName + '.blocks');
  if (blockFileIndex < 0) {
    console.log(fileName + '.blocks');
    throw Error('Unable to find block for file for corresponding code file: ', codeFile);
  }
  const blockFile = blockFiles[blockFileIndex];
  const codeFileContents = fs.readFileSync(path.join(codeDirectory, codeFile), 'utf-8');
  const blockFileContents = fs.readFileSync(path.join(blocksDirectory, blockFile), 'utf-8');

  try {
    // Decompile the code.
    var workspace = new Blockly.Workspace();
    decompile(workspace, codeFileContents);
    var xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace, true));
    if (blockFileContents != xml) {
      throw Error(`The decompilation result for test ${codeFile} is inconsistent with the expected result`, blockFileContents, xml);
    }
    // Round trip to check.
    var newCode = Blockly.JavaScript.workspaceToCode(workspace);
    if (codeFileContents != newCode) {
      throw Error(`Failed to round trip for test ${codeFile}.`, codeFileContents, newCode);
    }
  } catch (error) {
    failedTests++;
    console.error(`Test for ${codeFile} failed with error: `, error);
  }
});

if (failedTests) {
  console.log(`${failedTests} tests failed.`);
} else {
  console.log('All tests ran successfully.');
}
