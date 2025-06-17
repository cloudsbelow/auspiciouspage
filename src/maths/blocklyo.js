import { Blocks, Generator, inject } from "blockly"
import { pcomp } from "./intProg"
import {addControlBlocks, controlColor} from "./blocklyblocks/control"
import { addStatementBlocks, mathColor } from "./blocklyblocks/statement";

const tabs = [{
  content:addControlBlocks(),
  color:controlColor,
  label:"Flow",
},{
  content:addStatementBlocks(),
  color:mathColor,
  label:"Math",
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

const generator = new Generator('AuspiciousScript');
