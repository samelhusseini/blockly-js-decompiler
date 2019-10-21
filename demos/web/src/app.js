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
 * @fileoverview Web app demo using the JS decompiler.
 * @author samelh@google.com (Sam El-Husseini)
 */
'use strict';

import * as Blockly from 'blockly';
import * as monaco from 'monaco-editor';
import * as decompile from 'blockly-js-decompiler';

var workspace = null;

self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
}

monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
	target: monaco.languages.typescript.ScriptTarget.ES5,
	noSemanticValidation: false,
	noSyntaxValidation: false
});

var editor = monaco.editor.create(document.getElementById('container'), {
	value: [
		'for (var count = 0; count < 10; count++) {',
		'}'
	].join('\n'),
	language: 'javascript',
	theme: "vs-dark",
	minimap: false
});

var ignoreInternalEvent = false;

editor.onDidChangeModelContent((e) => {
	if (ignoreInternalEvent) {
		return;
	}
	var code = editor.getValue();
	codeToWorkspace(code);
});


function codeToWorkspace(code) {
	if (workspace) {
		Blockly.Events.disable();
		try {
			workspace.clear();
			// Decompile
			decompile(workspace, code);
			workspace.render();
			workspace.cleanUp();
			console.log(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace, true)));
		} finally {
			Blockly.Events.enable();
		}
	}
}

document.addEventListener("DOMContentLoaded", function () {
	workspace = Blockly.inject('blocklyDiv',
		{
			trashcan: true,
			comments: true,
			move: {
				scrollbars: true,
				drag: true,
				wheel: false,
			},
			readOnly: false,
			media: 'media/'
		});
	workspace.addChangeListener((e) => {
		if (e.type !== 'ui' && !workspace.isDragging()) {
			var code = Blockly.JavaScript.workspaceToCode(workspace);
			ignoreInternalEvent = true;
			editor.setValue(code);
			ignoreInternalEvent = false;
		}
	});
	codeToWorkspace(editor.getValue());
});
