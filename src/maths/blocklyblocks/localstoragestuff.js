//import { Workspace } from "blockly";

import { _breffn, _div, _subidx } from "../../util/templates.js";

const SAVELOADSTR="m_"
const namebar = document.getElementById("namebar")


export const currentLoadInfo = {
  savename:"",
  saveinfo:""
}
function getsaveinfo(){
  return Date.now();
}
function setsaveinfo(info){
  console.log(info);
}
/**
 * 
 * @param {Workspace} workspace 
 */
export function saveLoadSetup(workspace){

}

function save(){
  currentLoadInfo.saveinfo = getsaveinfo()
  let name = currentLoadInfo.savename;
  while(name == ""){
    name = prompt("Please title project before saving")
    if(name=="") if(confirm("cancel?")) return;
    if(localStorage.getItem(SAVELOADSTR+name)!=null){
      if(!confirm("This overrides an existing save - continue?")) name=""
    }
  }
  namebar.classList.remove("unsaved", "unnamed")
  namebar.innerText = saveinfo;
  localStorage.setItem(currentLoadInfo.savename, getsaveinfo());
}
document.getElementById("savebutton").onclick = save;

const loadcont = document.getElementById("loadcontainer")
const lc = document.getElementById("loadcontents")
class loadItem{
  static template = new _div({
    ref:"root",cn:"loadItem",c:[
      new _div({tc:new _subidx("name")}),
      new _div({onclick:new _breffn(loadItem.prototype.delete),tc:"X"})
    ], onclick:new _breffn(loadItem.prototype.load)
  })
  constructor(name){
    this.name=name;
    lc.appendChild(loadItem.template.mk(this,this))
  }
  delete(){
    localStorage.removeItem(this.name)
    lc.remove(this.root)
  }
  load(){
    currentLoadInfo.savename=this.name;
    currentLoadInfo.saveinfo=localStorage.getItem(this.name)
    setsaveinfo(currentLoadInfo.saveinfo)
    loadcont.style.display="none"
  }
}
function load(){
  for(let i=0; i<100; i++){
    new loadItem(i+" "+Math.random())
  }
}
window.load = load;