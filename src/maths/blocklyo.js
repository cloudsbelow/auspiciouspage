import { Blocks, Generator, inject, serialization } from "blockly"
import { pcomp } from "./intProg"
import { addControlBlocks } from "./blocklyblocks/control"
import { addStatementBlocks } from "./blocklyblocks/statement";
import { saveLoadSetup } from "./blockly/localstoragestuff.js";

import {addControlBlocks, controlColor} from "./blockly/control"
import { addStatementBlocks, mathColor } from "./blockly/statement";
import {addIngameBlocks, gameColor} from "./blockly/ingame.js";
import {registerFieldAngle} from "@blockly/field-angle";

registerFieldAngle()
const tabs = [{
  content:addControlBlocks(),
  color:controlColor,
  label:"Flow",
},{
  content:addStatementBlocks(),
  color:mathColor,
  label:"Math",
},{
  content:addIngameBlocks(),
  color:gameColor,
  label:"In-game",
}]
const toolbox = {
  kind: "flyoutToolbox",
  contents: []
}
const tabdiv = document.getElementById("categorySelector")
let selected = null;
tabs.forEach((tab)=>{
  const d = document.createElement('div');
  d.classList.add('tab');
  d.style.backgroundColor = `hsl(${tab.color} 29.1062162% 50.2072%)`;
  d.innerText = tab.label
  d.onclick = tab.onclick = ()=>{
    toolbox.contents = tab.content;
    selected?.classList.remove("selected");
    selected = d;
    d.classList.add("selected");
    workspace.updateToolbox(toolbox);
  }
  tabdiv.appendChild(d);
})

window.pc = pcomp
const container = document.getElementById("blocklyDiv")
var workspace = inject(container, {
  toolbox:toolbox,
  trashcan: true,
})
saveLoadSetup(()=>{
  return JSON.stringify(serialization.workspaces.save(workspace))
},(state)=>{
  return serialization.workspaces.load(JSON.parse(state),workspace)
});




export const generator = new Generator('AuspiciousScript');
