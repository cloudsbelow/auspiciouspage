import { Blocks, Events, FieldDropdown, FieldNumber, FieldTextInput } from "blockly";

export const mathColor = 100;

const operators = [
    ["*",2],
    ["/",2],
    ["%",2],
    ["+",3],
    ["-",3],
    ["<<",4],
    [">>",4],
    ["<=",5],
    [">=",5],
    ["<",5],
    [">",5],
    ["==",6],
    ["!=",6],
    ["&", 7],
    ["^", 8],
    ["|", 9],
    ["&&", 10],
    ["||", 11],
];

export function addStatementBlocks(){
  Blocks['ahs_print'] = {
    init: function() {
      this.appendDummyInput().appendField("print").appendField(new FieldTextInput("text"), "NAME");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.inputs_ = 0;
      this.ensureEmptyInput();
    },
    //tbh chatgpt wrote these two functions for me. thanks.
    trimTrailingInputs: function() {
      while (this.inputs_ > 1) {
        const lastIndex = this.inputs_ - 1;
        const input = this.getInput("ARG" + lastIndex);
        if (!input) {
          this.inputs_--;
          continue;
        }
        const isEmpty = !input.connection || !input.connection.targetBlock();
        const prevInput = this.getInput("ARG" + (lastIndex - 1));
        const prevConnected = prevInput && prevInput.connection && prevInput.connection.targetBlock();

        if (isEmpty && (!prevConnected || lastIndex > 1)) {
          this.removeInput("ARG" + lastIndex);
          this.inputs_--;
        } else {
          break;
        }
      }
    },
    ensureEmptyInput: function() {
      this.trimTrailingInputs();
      let inputCount = this.inputs_;
      let lastInput = this.getInput("ARG" + (inputCount - 1));
      if (!lastInput || (lastInput.connection && lastInput.connection.targetBlock())) {
        const inputName = "ARG" + inputCount;
        this.appendValueInput(inputName)
          .setCheck(null)
          .appendField(inputCount === 0 ? "" : ",");
        this.inputs_++;
      }
    },
    onchange: function(event) {
      if (!this.workspace || this.isInFlyout) return;
      if (event.type === Events.BLOCK_MOVE || event.type === Events.BLOCK_CHANGE || event.type === Events.END_DRAG) {
        this.ensureEmptyInput();
      }
    }
  };
  Blocks['ahs_number'] = {
    init: function() {
      this.appendDummyInput().appendField(new FieldNumber(0, -Infinity, Infinity, 1), "VALUE");
      this.setInputsInline(false);
      this.setOutput(true, "Number");
      this.setColour(mathColor);
    }
  }
  Blocks['ahs_flag'] = {
    init: function() {
      this.appendDummyInput().appendField("F").appendField(new FieldTextInput("flag"), "NAME");
      this.setInputsInline(false);
      this.setOutput(true, ["Number","Settable"]);
      this.setColour(mathColor);
    }
  }
  Blocks['ahs_channel'] = {
    init: function() {
      this.appendDummyInput().appendField("@").appendField(new FieldTextInput("channel"), "NAME");
      this.setInputsInline(false);
      this.setOutput(true, ["Number","Settable"]);
      this.setColour(mathColor);
    }
  }
  Blocks['ahs_variable'] = {
    init: function() {
      this.appendDummyInput().appendField("$").appendField(new FieldTextInput("variable"), "NAME");
      this.setInputsInline(false);
      this.setOutput(true, ["Number","Settable"]);
      this.setColour(mathColor);
    }
  }
  Blocks['ahs_set'] = {
    init: function() {
      this.appendValueInput("SET").setCheck("Settable").appendField("set");
      this.appendValueInput("VALUE").setCheck("Number").appendField("to");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(mathColor);
    }
  }
  Blocks['ahs_op'] = {
    init: function() {
      this.appendValueInput("ARG1").setCheck("Number");
      this.appendDummyInput()
        .appendField(new FieldDropdown(operators.map(x=>[x[0],x[0]])), "NAME");

      this.appendValueInput("ARG2").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(mathColor);
    }
  }
  Blocks['ahs_not'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new FieldDropdown([["!","!"],["~","~"]]), "NAME");

      this.appendValueInput("ARG").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(mathColor);
    }
  }

  return [
      {kind:"block",type:"ahs_print"},
      {kind:"block",type:"ahs_number"},
      {kind:"block",type:"ahs_channel"},
      {kind:"block",type:"ahs_variable"},
      {kind:"block",type:"ahs_flag"},
      {kind:"block",type:"ahs_set"},
      {kind:"block",type:"ahs_op"},
      {kind:"block",type:"ahs_not"},
    ]
}
