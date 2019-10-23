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
 * @fileoverview JavaScript to Blockly blocks decompiler.
 * @author samelh@google.com (Sam El-Husseini)
 */


var Blockly = require('blockly');
var ts = require('typescript');

var registry = require('./registry');
require('./decompiler/math');

var SK = ts.SyntaxKind;

function decompile(workspace, code) {
  var sourceFile = ts.createSourceFile(
    'blocks.js',
    code,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
  );

  Blockly.Events.disable();
  try {
    ts.forEachChild(sourceFile, decompileTopNode);
  } finally {
    Blockly.Events.enable();
  }

  function makeBlock(prototype_name) {
    if (workspace.rendered) {
      var block = new Blockly.BlockSvg(workspace, prototype_name);
      block.initSvg();
      return block;
    } else {
      return new Blockly.Block(workspace, prototype_name);
    }
  }

  function connectBlock(block, inputName, otherConnection) {
    var input = block.getInput(inputName);
    if (input) {
      // Check that we can connect.
      if (otherConnection &&
          input.connection.isConnectionAllowed(otherConnection)) {
        input.connection.connect(otherConnection);
        return true;
      } else {
        console.warn(`Cannot connect ${block.type} with`, otherConnection);
      }
    } else {
      console.warn(`No ${inputName} input on block ${block.type}`);
    }
    if (otherConnection) {
      // Remove the other block.
      var otherBlock = otherConnection.getSourceBlock();
      otherBlock.dispose();
    }

    return false;
  }

  function makeNumberBlock(input, isShadow) {
    var block = makeBlock('math_number');
    block.setShadow(isShadow);
    if (input) input.connection.connect(block.outputConnection);
    return block;
  }

  function makeBooleanBlock(input, isShadow) {
    var block = makeBlock('logic_boolean');
    block.setShadow(isShadow);
    if (input) input.connection.connect(block.outputConnection);
    return block;
  }

  function makeTextBlock(input, isShadow) {
    var block = makeBlock('text');
    block.setShadow(isShadow);
    if (input) input.connection.connect(block.outputConnection);
    return block;
  }

  /**
   * 
   * @param {ts.IfStatement} n
   */
  function flattenIfStatement(n) {
    let r = {
      ifStatements: [{
        expression: n.expression,
        thenStatement: n.thenStatement
      }],
      elseStatement: n.elseStatement
    }
    if (n.elseStatement && n.elseStatement.kind == SK.IfStatement) {
      let flat = flattenIfStatement(/** @type {ts.IfStatement} */(n.elseStatement));
      r.ifStatements = r.ifStatements.concat(flat.ifStatements);
      r.elseStatement = flat.elseStatement;
    }
    return r;
  }

  /**
   * Get a binary expression.
   * @param {ts.BinaryExpression} node Binary expression.
   * @return {!Blockly.Block} Logic operation or comparison block.
   */
  function getBinaryExpression(node) {
    switch (node.operatorToken.kind) {
      case SK.AmpersandAmpersandToken:
        var block = makeBlock('logic_operation');
        block.getField('OP').setValue('AND');
        break;
      case SK.BarBarToken:
        var block = makeBlock('logic_operation');
        block.getField('OP').setValue('OR');
        break;
      case SK.EqualsEqualsToken:
      case SK.EqualsEqualsEqualsToken:
        var block = makeBlock('logic_compare');
        block.getField('OP').setValue('EQ');
        break;
      case SK.ExclamationEqualsToken:
      case SK.ExclamationEqualsEqualsToken:
        var block = makeBlock('logic_compare');
        block.getField('OP').setValue('NEQ');
        break;
      case SK.LessThanToken:
        var block = makeBlock('logic_compare');
        block.getField('OP').setValue('LT');
        break;
      case SK.LessThanEqualsToken:
        var block = makeBlock('logic_compare');
        block.getField('OP').setValue('LTE');
        break;
      case SK.GreaterThanToken:
        var block = makeBlock('logic_compare');
        block.getField('OP').setValue('GT');
        break;
      case SK.GreaterThanEqualsToken:
        var block = makeBlock('logic_compare');
        block.getField('OP').setValue('GTE');
        break;
      case SK.PlusToken:
        var block = makeBlock('math_arithmetic');
        block.getField('OP').setValue('ADD');
        break;
      case SK.MinusToken:
        var block = makeBlock('math_arithmetic');
        block.getField('OP').setValue('MINUS');
        break;
      case SK.SlashToken:
        var block = makeBlock('math_arithmetic');
        block.getField('OP').setValue('DIVIDE');
        break;
      case SK.AsteriskToken:
        var block = makeBlock('math_arithmetic');
        block.getField('OP').setValue('MULTIPLY');
        break;
      case SK.CaretToken:
        var block = makeBlock('math_arithmetic');
        block.getField('OP').setValue('POWER');
        break;
      default:
        console.warn(`Unknown binary expression ${node.operatorToken.kind}`);
    }
    if (block) {
      var left = getOutputBlock(node.left);
      if (left) {
        connectBlock(block, 'A', left.outputConnection);
      }
      var right = getOutputBlock(node.right);
      if (right) {
        connectBlock(block, 'B', right.outputConnection);
      }
    }
    return block;
  }

  /**
   * Decompile an if statement.
   * @param {ts.IfStatement} node If Statement node.
   * @return {!Blockly.Block} The if statement block.
   */
  function getIfStatement(node) {
    var flattened = flattenIfStatement(node);

    var block = /** @type {*} */ (makeBlock('controls_if'));
    block.elseIfCount_ = flattened.ifStatements.length;
    block.elseCount_ = flattened.elseStatement ? 1 : 0;
    block.updateShape_();

    flattened.ifStatements.forEach((stmt, i) => {

      // Expression
      var boolBlock = getOutputBlock(stmt.expression);
      if (boolBlock) {
        connectBlock(block, 'IF' + i, boolBlock.outputConnection);
      }

      // Then statement
      var thenStatement = getStatementBlock(stmt.thenStatement);
      if (thenStatement) {
        connectBlock(block, 'DO' + i, thenStatement.previousConnection);
      }

    });

    // Else statement
    if (flattened.elseStatement) {
      var elseStatement = getStatementBlock(flattened.elseStatement);
      if (elseStatement) {
        connectBlock(block, 'ELSE', elseStatement.previousConnection);
      }
    }

    return block;
  }

  /**
   * Decompile a while statement into a while block.
   * @param {ts.WhileStatement} node While Statement node.
   * @return {!Blockly.Block} The while block.
   */
  function getWhileStatement(node) {
    var block = makeBlock('controls_whileUntil');
    block.getField('MODE').setValue('WHILE');

    // Expression
    var boolBlock = getOutputBlock(node.expression);
    if (boolBlock) {
      connectBlock(block, 'BOOL', boolBlock.outputConnection);
    }

    // Statement
    var statementBlock = getStatementBlock(node.statement);
    if (statementBlock) {
      connectBlock(block, 'DO', statementBlock.previousConnection);
    }

    return block;
  }

  /**
   * 
   * @param {ts.ForStatement} node For Statement node.
   * @return {!Blockly.Block}
   */
  function getForStatement(node) {
    var initializer = node.initializer;
    var condition = node.condition;
    var incrementor = node.incrementor;

    var indexVar = initializer.declarations ?
      initializer.declarations[0].name.text : initializer.left.text;
    var fromValue = initializer.declarations ?
      initializer.declarations[0].initializer.text : initializer.right.text;

    var block = makeBlock('controls_for');
    var variable = workspace.createVariable(indexVar);
    block.getField('VAR').setValue(variable.getId());

    if (incrementor.kind == SK.PostfixUnaryExpression) {
      let byValue;
      var postfixIncrementor = /** @type {ts.PostfixUnaryExpression} */ (incrementor);
      switch (postfixIncrementor.operator) {
        case SK.PlusPlusToken:
          byValue = 1; break;
        case SK.MinusMinusToken:
          byValue = -1; break;
        default:
          byValue = 1;
      }
      makeNumberBlock(block.getInput('BY'), true)
        .getField('NUM').setValue(byValue);
    } else if (incrementor.kind == SK.BinaryExpression) {
      var binaryIncrementor = /** @type {ts.BinaryExpression} */ (incrementor);
      var multiplier = 1;
      if (binaryIncrementor.operatorToken) {
        switch (binaryIncrementor.operatorToken.kind) {
          case ts.SyntaxKind.PlusEqualsToken:
            multiplier = 1; break;
          case ts.SyntaxKind.MinusEqualsToken:
            multiplier = -1; break;
        }
        if (multiplier) {
          var rightBlock = getOutputBlock(binaryIncrementor.right);
          if (rightBlock) {
            if (multiplier == -1) {
              var negBlock = makeBlock('math_single');
              negBlock.getField('OP').setValue('NEG');
              connectBlock(negBlock, 'NUM', rightBlock.outputConnection);
              connectBlock(block, 'BY', negBlock.outputConnection);
            } else {
              connectBlock(block, 'BY', rightBlock.outputConnection);
            }
          }
        }
      }
    }

    makeNumberBlock(block.getInput('FROM'), true)
      .getField('NUM').setValue(fromValue);


    if (condition.kind == SK.BinaryExpression) {
      var binaryCondition = /** @type {ts.BinaryExpression} */ (condition);
      var toValueBlock = getOutputBlock(binaryCondition.right);

      if (toValueBlock) {
        connectBlock(block, 'TO', toValueBlock.outputConnection);
      }
    }

    var statementBlock = getStatementBlock(node.statement);
    if (statementBlock) {
      connectBlock(block, 'DO', statementBlock.previousConnection);
    }

    return block;
  }

  /**
   * @param {ts.CallExpression} node
   */
  function getCallStatement(node) {
    var args = node.arguments;
    var expression = node.expression;

    switch (expression.kind) {
      case SK.PropertyAccessExpression:
        var propertyAccess = /** @type {ts.PropertyAccessExpression} */ (expression);
        if (propertyAccess.expression && propertyAccess.expression.kind == SK.Identifier) {
          var namespace = /** @type {ts.Identifier} */ (propertyAccess.expression);
          if (namespace.text == 'Math') {
            var name = propertyAccess.name.text;
            var mathBlock = getMathBlock(name, args);
            if (mathBlock) {
              return mathBlock;
            }
          }
          var qualifiedName = namespace.text + '.' + propertyAccess.name.text;
          var blockType = registry.getCallStatement(qualifiedName);
          if (blockType) {
            var block = makeBlock(blockType.type);
            return block;
          }
        }
        break;
    }

    return null;
  }

  /**
   * Get a math block.
   * @param {string} name Name of the Math method.
   * @param {*} args ARguments
   */
  function getMathBlock(name, args) {
    var type = '';
    var operator = '';

    switch (name) {
      case 'floor': type = 'math_round'; operator = 'ROUNDDOWN'; break;
      case 'ceil': type = 'math_round'; operator = 'ROUNDUP'; break;
      case 'round': type = 'math_round'; operator = 'ROUND'; break;

      case 'sqrt': type = 'math_single'; operator = 'ROOT'; break;
      case 'exp': type = 'math_single'; operator = 'EXP'; break;
      case 'abs': type = 'math_single'; operator = 'ABS'; break;
      case 'pow': type = 'math_single'; operator = 'POW10'; break;
      case 'log': type = 'math_single'; operator = 'LN'; break;
      case 'log': type = 'math_single'; operator = 'LOG10'; break;

      case 'asin':
      case 'acos':
      case 'atan':
      case 'sin':
      case 'cos':
      case 'tan':
        type = 'math_trig';
        operator = name.toUpperCase(); break;
    }
    if (type) {
      var block = makeBlock(type);
      block.getField('OP').setValue(operator);

      var argument = args[0];
      if (argument) {
        var argumentBlock = getOutputBlock(argument);
        if (argumentBlock) {
          connectBlock(block, 'NUM', argumentBlock.outputConnection);
        }
      }

      return block;
    }
    return null;
  }

  function getVariableSetOrChange(set, name, right) {
    var block = makeBlock(set ? 'variables_set' : 'math_change');
    var variable = workspace.createVariable(name);
    block.getField('VAR').setValue(variable.getId());

    var outputBlock = getOutputBlock(right);
    if (outputBlock) {
      connectBlock(block, set ? 'VALUE' : 'DELTA', outputBlock.outputConnection);
    }
    return block;
  }

  /**
   * 
   * @param {ts.VariableDeclaration} node 
   */
  function getVariableDeclaration(node) {
    var name = (/** @type {ts.Identifier} */ (node.name)).text;
    workspace.createVariable(name);

    if (node.initializer) {
      return getVariableSetOrChange(true, name, node.initializer);
    }
    return null;
  }

  /**
   * 
   * @param {ts.BinaryExpression} node 
   */
  function getBinaryExpressionStatement(node) {
    var name = (/** @type {ts.Identifier} */ (node.left)).text;
    switch (node.operatorToken.kind) {
      case SK.PlusEqualsToken:
        return getVariableSetOrChange(false, name, node.right);
      case SK.MinusEqualsToken:
        // TODO, wrap in a NEG block.
        return getVariableSetOrChange(false, name, node.right);
      case SK.EqualsToken:
        if (node.left.kind === SK.Identifier) {
          return getVariableSetOrChange(true, name, node.right);
        }
        break;
      default:
        console.warn('Unknown binary expression statement operator: ', node.operatorToken.kind);
    }
    return null;
  }

  var previousTopNode = null;
  var previousTopBlock = null;
  function decompileTopNode(node) {
    var shouldConnectBlocks = false;
    if (previousTopNode) {
      var beforeLineChar = sourceFile.text.substr(getNodeLineStart(node, sourceFile) - 2, 1);
      if (beforeLineChar !== '\n') {
        shouldConnectBlocks = true;
      }
    }
    previousTopNode = node;
    var topBlock = getStatementBlock(node);
    if (previousTopBlock && topBlock && previousTopBlock.nextConnection &&
      topBlock.previousConnection && shouldConnectBlocks) {
      // Connect blocks.
      previousTopBlock.nextConnection.connect(topBlock.previousConnection);
    }
    previousTopBlock = topBlock;
  }

  /**
   * Gets position of start of line containing node
   */
  function getNodeLineStart(node, sourceFile, lineIndex) {
    if (lineIndex == null) lineIndex = 1;

    let pos = node.getStart();

    var comments = ts.getLeadingCommentRanges(sourceFile.text, node.pos) || [];
    if (comments.length > 0) {
      pos = comments[0].pos;
    }

    var lineStartPositions = sourceFile.getLineStarts();
    var startPosIdx = lineStartPositions.findIndex((startPos, idx) =>
      startPos > pos || idx === lineStartPositions.length - 1
    ) - lineIndex;

    return lineStartPositions[startPosIdx];
  }

  function getBlock(statements) {
    var previousBlock = null;
    for (var i = 0; i < statements.length; i++) {
      var block = getStatementBlock(statements[i]);
      if (previousBlock &&
        previousBlock.nextConnection && block && block.previousConnection) {
        // Connect the previous and next blocks
        previousBlock.nextConnection.connect(block.previousConnection);
      }
      if (block) {
        previousBlock = block;
      }
    }
    return previousBlock;
  }


  /**
   * Get an output block.
   * @param {*} node 
   * @return {Blockly.Block} An output block.
   */
  function getOutputBlock(node) {
    switch (node.kind) {
      case SK.BinaryExpression:
        return getBinaryExpression(node);
      case SK.StringLiteral:
        var textBlock = makeTextBlock(null, true);
        textBlock.getField('TEXT').setValue(node.text);
        return textBlock;
      case SK.NumericLiteral:
        var numberBlock = makeNumberBlock(null, true);
        numberBlock.getField('NUM').setValue(node.text);
        return numberBlock;
      case SK.FalseKeyword:
        var booleanBlock = makeBooleanBlock(null, true);
        booleanBlock.getField('BOOL').setValue('FALSE');
        return booleanBlock;
      case SK.TrueKeyword:
        var booleanBlock = makeBooleanBlock(null, true);
        booleanBlock.getField('BOOL').setValue('TRUE');
        return booleanBlock;
      case SK.Identifier:
        return getIdentifier(node);
      case SK.CallExpression:
        return getCallStatement(node);
      default:
        console.log('Unknown token ', node.kind);
    }
  }


  /**
   * Get a veriable
   * @param {ts.Identifier} node 
   */
  function getIdentifier(node) {
    var name = node.text;
    if (name) {
      var block = makeBlock('variables_get');
      var variable = workspace.createVariable(name);
      block.getField('VAR').setValue(variable.getId());
      return block;
    }

    return null;
  }

  /**
   * Get a statement block.
   * @param {*} node 
   * @return {Blockly.Block} A statement block.
   */
  function getStatementBlock(node) {
    switch (node.kind) {
      case SK.VariableDeclaration:
        return getVariableDeclaration(node);
      case SK.ParenthesizedExpression:
        return getStatementBlock(node.expression);
      case SK.BinaryExpression:
        return getBinaryExpressionStatement(node);
      case SK.Block:
        var blockNode = /** @type {ts.Block} */ (node);
        return getBlock(blockNode.statements);
      case SK.VariableStatement:
        var variableNode = /** @type {ts.VariableStatement} */ (node);
        return getBlock(variableNode.declarationList.declarations);
      case SK.ExpressionStatement:
        return getBlock(node.getChildren());
      case SK.WhileStatement:
        return getWhileStatement(node);
      case SK.ForStatement:
        return getForStatement(node);
      case SK.IfStatement:
        return getIfStatement(node);
      case SK.EmptyStatement:
      case SK.EndOfFileToken:
        return null;
      case SK.CallExpression:
        return getCallStatement(node);
      default:
        console.warn('Unknown node: ', node.kind);
    }
  }
}

module.exports = decompile;