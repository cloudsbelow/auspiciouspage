import { Blocks } from "blockly";


export function addControlBlocks(){
  const ifs = new Set(["ahc_if", "ahc_elseif"]);
  const ensureif = function(event){
    if (!this.workspace || this.isInFlyout || !this.getPreviousBlock()) return;
    if(ifs.has(this.getPreviousBlock().type)){
      this.setWarningText(null); return;
    }
    this.setWarningText("Must follow if or else if!");
  }
  Blocks['ahc_if'] = {
    init: function() {
      this.appendValueInput("CONDITION").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("If");
      this.appendStatementInput("CODE").setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, "IF");
      this.setColour(230);
      this.setTooltip("Execute the inner code if the provided condition is nonzero");
    }
  };
  Blocks['ahc_elseif'] = {
    init: function() {
      this.appendValueInput("CONDITION").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("Else If");
      this.appendStatementInput("CODE").setCheck(null);
      this.setPreviousStatement(true, "IF");
      this.setNextStatement(true, "IF");
      this.setColour(230);
      this.setTooltip("Execute the inner code if previous if statement not triggered and provided condition is nonzero");
    },
    onchange:ensureif
  };
  Blocks['ahc_else'] = {
    init: function() {
      this.appendValueInput("CONDITION").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("Else");
      this.appendStatementInput("CODE").setCheck(null);
      this.setPreviousStatement(true, "IF");
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Execute the inner code if previous if statement not triggered");
    },
    onchange:ensureif
  };

  const loops = new Set(["ahc_while", "ahc_loop"]);
  const ensureloop = function(event){
    if (!this.workspace || this.isInFlyout) return;
    let c=this;
    while(c=c.getSurroundParent()) if(loops.has(c.type)){
      this.setWarningText(null); return;
    }
    this.setWarningText("Must be in loop!");
  }
  Blocks['ahc_while'] = {
    init: function() {
      this.appendValueInput("CONDITION").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("While");
      this.appendStatementInput("CODE").setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Execute the inner code while some condition is nonzero");
    }
  };
  Blocks['ahc_break'] = {
    init: function() {
      this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Break");
      this.setColour(230)
      this.setPreviousStatement(true, null);
      this.setTooltip("Leave the surrounding loop");
    },
    onchange: ensureloop
  };
  Blocks['ahc_continue'] = {
    init: function() {
      this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Continue");
      this.setColour(230)
      this.setPreviousStatement(true, null);
      this.setTooltip("Go to next iteration of surrounding loop");
    },
    onchange: ensureloop
  };
  Blocks['ahc_exit'] = {
    init: function() {
      this.appendDummyInput().setAlign(Blockly.ALIGN_RIGHT).appendField("Exit");
      this.setColour(230)
      this.setPreviousStatement(true, null);
      this.setTooltip("Exit the program");
    },
  };
  Blocks['ahc_wait'] = {
    init: function() {
      this.appendValueInput("a")
          .setCheck(null)
          .appendField("Wait");
      this.setPreviousStatement(true, null);
      this.setColour(230);
      this.setTooltip("Time to pause program execution (centiseconds)");
    }
  };
  return [
      {kind:"block", type:"ahc_if"},
      {kind:"block", type:"ahc_elseif"},
      {kind:"block", type:"ahc_else"},
      {kind:"block", type:"ahc_while"},
      {kind:"block", type:"ahc_break"},
      {kind:"block", type:"ahc_continue"},
      {kind:"block", type:"ahc_exit"},
      {kind:"block", type:"ahc_wait"},
    ]
}