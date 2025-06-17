import { Blocks, Generator, inject, serialization } from "blockly"
import { pcomp } from "./intProg"
import { addControlBlocks } from "./blocklyblocks/control"
import { addStatementBlocks } from "./blocklyblocks/statement";


const tabs = [{
  content:addControlBlocks(),
  color:"#dd7722",
  label:"flow",
},{
  content:addStatementBlocks(),
  color:"#aa44ff",
  label:"math",
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
  d.style.backgroundColor = tab.color;
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
var workspace = inject(container, {toolbox:toolbox})
window.saveLoadSetup(workspace);

const generator = new Generator('AuspiciousScript');


