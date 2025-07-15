import {Blocks, Events, FieldTextInput, Extensions, FieldImage} from "blockly";
import {simpleBlock, generator} from "./utils.js";
import { pcomp } from "../intProg.js";
import { keys } from "../../util/util.js";

export const controlColor = 240;
const compileButtonPath = "/src/maths/blockly/compile.svg";

function closeOutput(){
  keys.on.Escape.delete(closeOutput);
  ocont.style.display="none"
}

let lastasm=""
const ocont = document.getElementById("outputcontainer")
document.getElementById("clickthrublocker2").onclick = closeOutput;
const genout = document.getElementById("generatedtext")
const compiledout = document.getElementById("compiled")
document.getElementById("copybutton").onclick = ()=>{
  navigator.clipboard.writeText(lastasm); alert("done");
}


export function addControlBlocks(){
  Blocks['program_header'] = simpleBlock(function() {
    this.hat = "cap"
    this.appendDummyInput('').appendField('routine block').appendField(new FieldTextInput(''), '');
    this.appendDummyInput('').appendField(new FieldImage(compileButtonPath, 90, 30, "", ()=>{
      try{
        ocont.style.display = "block";
        const nextBlock = this.nextConnection && this.nextConnection.targetBlock();
        const nextCode = window.lastgenerated = genout.innerText = generator.blockToCode(nextBlock);
        console.log(nextCode)
        lastasm = compiledout.innerText = pcomp(nextCode);
        keys.on.Escape.add(closeOutput);
      } catch(ex){
        compiledout.innerText = "-ERROR-"
        //alert('Some error occured:\n'+ex);
        console.error("Error:",ex)
      }
    }, false, {

    }), '');
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour("#e4bd00");
  });

  Blocks['ahc_if'] = simpleBlock(function() {
    this.appendValueInput("IF0").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("if");
    this.appendStatementInput("DO0").setCheck(null).setAlign(Blockly.ALIGN_RIGHT).appendField("do");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
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
    this.appendValueInput("CS").setCheck(null).appendField("waitCs");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(controlColor);
    this.setTooltip("Time to pause program execution (centiseconds)");
  });
  Blocks['ahc_waitMs'] = simpleBlock(function() {
    this.appendValueInput("MS").setCheck(null).appendField("waitMs");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(controlColor);
    this.setTooltip("Time to pause program execution (milliseconds)");
  });
  return [
    {kind:"block", type:"program_header"},
    {kind:"block", type:"ahc_if"},
    {kind:"block", type:"ahc_while"},
    {kind:"block", type:"ahc_break"},
    {kind:"block", type:"ahc_continue"},
    {kind:"block", type:"ahc_exit"},
    {kind:"block", type:"ahc_wait"},
    {kind:"block", type:"ahc_waitMs"},
  ];
}
