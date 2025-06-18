//import { Workspace } from "blockly";

import { _breffn, _div, _subidx } from "../../util/templates.js";
import { keys } from "../../util/util.js";

const SAVELOADSTR="ahmc_"
const namebar = document.getElementById("namebar")

let justloaded = true;
export const currentLoadInfo = {
  savename:"",
  saveinfo:"",
  getcur:null,
  setcur:null,
  inmenus:0,
}

/**
 * 
 * @param {Workspace} workspace 
 */
export function saveLoadSetup(getcur,setcur){
  console.log(getcur,setcur)
  currentLoadInfo.getcur=getcur;
  currentLoadInfo.setcur=setcur;
  setInterval(() => {
    if(currentLoadInfo.saveinfo!=currentLoadInfo.getcur()) namebar.classList.add("unsaved")
  }, 1000);
}

function save(){
  currentLoadInfo.saveinfo = currentLoadInfo.getcur()
  let name = currentLoadInfo.savename;
  while(name == ""){
    name = prompt("Please title project before saving")
    if(name=="") if(confirm("cancel?")) return;
    if(localStorage.getItem(SAVELOADSTR+name)!=null){
      if(!confirm("This overrides an existing save - continue?")) name=""
    }
  }
  currentLoadInfo.savename=name;
  namebar.classList.remove("unsaved", "unnamed")
  namebar.innerText = currentLoadInfo.savename;
  localStorage.setItem(SAVELOADSTR+currentLoadInfo.savename, currentLoadInfo.saveinfo = currentLoadInfo.getcur());
}
document.getElementById("savebutton").onclick = save;
window.addEventListener("beforeunload",()=>{
  if(currentLoadInfo.saveinfo==currentLoadInfo.getcur()) return;
  if(confirm("You have unsaved work. Save it?"))save();
})
keys.on.S.add((event)=>{
  event.preventDefault();
  if(event.ctrlKey && currentLoadInfo.inmenus == 0) save()
})

const loadcont = document.getElementById("loadcontainer")
const lc = document.getElementById("loadcontents")
class loadItem{
  static template = new _div({
    ref:"root",cn:"loadItem",c:[
      new _div({tc:new _subidx("name")}),
      new _div({onclick:new _breffn(loadItem.prototype.delete),tc:"X",cn:"delloaditem"})
    ], onclick:new _breffn(loadItem.prototype.load)
  })
  constructor(name){
    this.name=name;
    lc.appendChild(loadItem.template.mk(this,this))
  }
  delete(event){
    event.stopPropagation();
    localStorage.removeItem(SAVELOADSTR+this.name)
    lc.removeChild(this.root)
  }
  load(){
    currentLoadInfo.savename=namebar.innerText=this.name;
    currentLoadInfo.saveinfo=localStorage.getItem(SAVELOADSTR+this.name)
    currentLoadInfo.setcur(currentLoadInfo.saveinfo)
    justloaded=false;
    closemenu()
  }
}
function closemenu(){
  lc.innerHTML="";
  loadcont.style.display="none";
  keys.on.Escape.delete(closemenu)
  currentLoadInfo.inmenus=0
  if(justloaded) makenew();
  justloaded = false;
}
function load(){
  keys.on.Escape.add(closemenu)
  currentLoadInfo.inmenus=1
  lc.innerHTML="";
  loadcont.style.display="block"
  for(let i=0; i<localStorage.length; i++){
    let key = localStorage.key(i);
    if(key.startsWith(SAVELOADSTR)){
      new loadItem(key.substring(SAVELOADSTR.length));
    }
  }
}
load()
document.getElementById("loadbutton").onclick = load;
document.getElementById("clickthrublocker1").onclick = closemenu;
window.load = load;

function makenew(){
  currentLoadInfo.setcur(currentLoadInfo.saveinfo = "{}")
  namebar.innerText="Untitled"
  namebar.classList.add("unnamed")
  currentLoadInfo.savename=""
}
document.getElementById("loadmenuNewbutton").onclick = function(){
  closemenu()
  makenew()
}
document.getElementById("newbutton").onclick = function(){
  if(currentLoadInfo.saveinfo!=currentLoadInfo.getcur()){
    if(confirm("You have unsaved work. Would you like to save it?")) save();
  }
  makenew();
}

namebar.onclick = function(){
  var name = prompt("Enter a new name")
  if(name=="" || name==null) return;
  if(localStorage.getItem(SAVELOADSTR+name)!=null){
    if(!confirm("This overrides an existing save - continue?")) return;
  }
  namebar.innerText = name;
  currentLoadInfo.savename = name;
  save();
}