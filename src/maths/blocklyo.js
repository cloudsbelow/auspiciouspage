import { Blocks, Generator, inject } from "blockly"
import { pcomp } from "./intProg"
import { addControlBlocks } from "./blocklyblocks/control"
import { addStatementBlocks } from "./blocklyblocks/statement";

addControlBlocks();
addStatementBlocks();

const toolbox = {
  kind: "categoryToolbox",
  contents: [{
    kind:"category",
    name:"flow",
    contents:[
      {kind:"block", type:"ahc_if"},
      {kind:"block", type:"ahc_elseif"},
      {kind:"block", type:"ahc_else"},
      {kind:"block", type:"ahc_while"},
      {kind:"block", type:"ahc_break"},
      {kind:"block", type:"ahc_continue"},
      {kind:"block", type:"ahc_exit"},
      {kind:"block", type:"ahc_wait"},
    ]
  },{
    kind:"category",
    name:"math",
    contents:[
      {kind:"block",type:"ahs_print"},
      {kind:"block",type:"ahs_number"},
      {kind:"block",type:"ahs_channel"},
      {kind:"block",type:"ahs_variable"},
      {kind:"block",type:"ahs_flag"},
      {kind:"block",type:"ahs_set"},
      {kind:"block",type:"ahs_op"},
      {kind:"block",type:"ahs_not"},
    ]
  }]
}
window.pc = pcomp
const container = document.getElementById("blocklyDiv")
inject(container, {toolbox:toolbox})

const generator = new Generator('AuspiciousScript');