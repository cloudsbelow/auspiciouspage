import {Blocks, Events, FieldTextInput, Extensions} from "blockly";
import {simpleBlock} from "./utils.js";

export const controlColor = 240;

export function addControlBlocks(){
  Blocks['program_header'] = simpleBlock(function() {
    this.hat = "cap"
    this.appendDummyInput('').appendField('program block').appendField(new FieldTextInput(''), '');
    this.setInputsInline(true)
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour("#e4bd00");
  });

  Blocks['ahc_if'] = simpleBlock(function() {
    this.appendValueInput("CONDITION0").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("if");
    this.appendStatementInput("CODE0").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, "IF");
    this.setColour(controlColor);
    this.setTooltip("Execute the inner code if the provided condition is nonzero");

    Extensions.apply('controls_if_mutator', this, true);
  });

  const loops = new Set(["ahc_while", "ahc_loop"]);
  const loopDisableReason = "Must be in loop!";
  const ensureloop = function(event){
    if (!this.workspace || this.isInFlyout) return;
    let c=this;
    while(c=c.getSurroundParent()) {
      if (loops.has(c.type)) {
        this.setWarningText(null);
        this.setDisabledReason(false, loopDisableReason);
        return;
      }
    }
    this.setWarningText("Must be in loop!");
    this.setDisabledReason(true, loopDisableReason);
  }
  Blocks['ahc_while'] = simpleBlock(function() {
    this.appendValueInput("CONDITION").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("while");
    this.appendStatementInput("CODE").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(controlColor);
    this.setTooltip("Execute the inner code while some condition is nonzero");
  });
  Blocks['ahc_break'] = {
    init: function() {
      this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("break");
      this.setColour(controlColor)
      this.setPreviousStatement(true, null);
      this.setTooltip("Leave the surrounding loop");
    },
    onchange: ensureloop
  };
  Blocks['ahc_continue'] = {
    init: function() {
      this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("continue");
      this.setColour(controlColor)
      this.setPreviousStatement(true, null);
      this.setTooltip("Go to next iteration of surrounding loop");
    },
    onchange: ensureloop
  };
  Blocks['ahc_exit'] = simpleBlock(function() {
    this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("exit");
    this.setColour(controlColor)
    this.setPreviousStatement(true, null);
    this.setTooltip("Exit the program");
  });
  Blocks['ahc_wait'] = simpleBlock(function() {
    this.appendValueInput("a")
        .setCheck(null)
        .appendField("wait");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(controlColor);
    this.setTooltip("Time to pause program execution (centiseconds)");
  });
  return [
    {kind:"block", type:"program_header"},
    {kind:"block", type:"ahc_if"},
    {kind:"block", type:"ahc_while"},
    {kind:"block", type:"ahc_break"},
    {kind:"block", type:"ahc_continue"},
    {kind:"block", type:"ahc_exit"},
    {kind:"block", type:"ahc_wait"},
  ];
}
