import { _breffn, _div, _subidx, deferedstring } from "./templates.js"
import { clamp } from "./util.js";





export class CustomContextmenu{
  constructor(options,parentinfo=null){
    this.elem=container.mk("",this);
    options.forEach(opt => {
      if(opt.horizontalBar){
        this.elem.appendChild(horizontalBar.mk(null,this));
      }if(opt.submenu){
        
      }else {
        this.elem.appendChild(genericOption.mk([opt.o,opt.label??opt.o],this));
      }
    });
  }
  summon(container,x,y,bounds){
    if(this.elem.parentElement)this.elem.remove();
    container.appendChild(this.elem);
    this.elem.style.top=clamp(y,0,bounds.height-this.elem.offsetHeight)
    this.elem.style.left=clamp(x,0,bounds.width-this.elem.offsetWidth)
    this.bounds=bounds;
  }
  select(option){
    console.log(option)
  }

}

const container = new _div({
  class:"cm-elem",
})
const genericOption = new _div({
  ref:["oelems",new _subidx(0)],
  textContent:new _subidx(1),
  onclick:new _breffn(CustomContextmenu.prototype.select, new _subidx(0)),
  class:"cm-basicopt"
})
const horizontalBar = new _div({
  class:"cm-hb"
})