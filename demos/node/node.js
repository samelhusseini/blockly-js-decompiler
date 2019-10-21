
var Blockly = require('blockly');
var decompile = require('blockly-js-decompiler');

var code = `
var count;

// while(!count) {
//   count++;
// }

if (Math.pow(1)) {
  while(true) {
    for (count = 0; count <= 10; count += 0) {
      for (count = 1; count <= 21; count += 0) {
        for (count = 11; count <= 123; count += 0) {
        }
        for (count = 11; count <= 12312; count += 0) {
        }
      }
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