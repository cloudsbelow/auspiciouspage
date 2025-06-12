
const buttonToButtons=[1,4,2,8,16];
export function doWinDrag(dragcb,donecb,escapable=false,first=null,buttons=0){
  let last=first;
  let done=false;
  const end = (ev,good)=>{
    if(done) return;
    done=true;
    if(escapable) keys.on.Escape.delete(cancel);
    window.removeEventListener("mousemove",move);
    window.removeEventListener("mouseup",up);
    if(donecb) donecb(ev, good);
  }
  const move = (ev)=>{
    if(buttons&&!(ev.buttons&buttons)){
      end(last,true);
      return;
    }
    last=ev;
    if(dragcb)dragcb(ev);
  }
  const cancel = (ev)=>{
    end(last, false);
  }
  const up = (ev)=>{
    if(buttons && !(buttonToButtons[ev.button] & buttons)) return;
    end(ev, true);
  }
  if(escapable) keys.on.Escape.add(cancel);
  window.addEventListener("mousemove",move);
  window.addEventListener("mouseup",up);
}

function initializingHandler(constr,remap=null){
  return {get:(targ,p,rec)=>{
    if(remap) p=remap(p)
    if(targ[p] === undefined){
      targ[p] = constr()
    }
    return targ[p]
  }}
}
const onfns = {
  down:{label:"down"},
  up:{label:"up"}
}
const remapkey = (key)=>{
  if(key.length == 1) return "Key"+key.toUpperCase();
  return key;
}
export const keys = {
  on: new Proxy(onfns.down,initializingHandler(()=>new Set(),remapkey)),
  onup: new Proxy(onfns.up,initializingHandler(()=>new Set(),remapkey))
}
window.addEventListener("keydown",(ev)=>{
  keys[ev.code]=Date.now();
  let m;
  if(m=onfns.down[ev.code]){
    m.forEach(f=>f(ev))
  }
})
window.addEventListener("keyup",(ev)=>{
  let delt = Date.now()-keys[ev.key];
  keys[ev.code]=0;
  let m;
  if(m=onfns.up[ev.code]){
    m.forEach(f=>f(ev,delt))
  }
})

export const mouseClientPos={x:0,y:0};
window.addEventListener("mousemove",(ev)=>{
  mouseClientPos.x=ev.clientX
  mouseClientPos.y=ev.clientY
})

export function clamp(f,l,h){
  return f<l?l:(f>h?h:f)
}

export function b_cc(...bufs){
  let offsets = [];
  let coff = 0
  for(let i=0; i<bufs.length; i++){
    offsets.push(coff);
    coff+=bufs[i].byteLength
  }
  let res = new Uint8Array(coff)
  for(let i=0; i<bufs.length; i++){
    res.set(new Uint8Array(bufs[i].buffer, bufs[i].byteOffset, bufs[i].byteLength),offsets[i])
  }
  return res
}

export class BAsyncObj{
  constructor(unrest=1){
    this._u=unrest;
    this._f=null
    this._l=null
  }
  when(fn){
    if(this.unrest==0&&!this._f) fn(this);
    else {
      let temp=[fn,null]
      if(this._f){
        this._l[1]=temp
        this._l=temp
      } else {
        this._f=temp
        this._l=temp
      }
    }
    return this
  }
  settle(){
    this._u--;
    while(this._u==0 && this._f){
      this._f[0](this)
      this._f=this._f[1]
    }
  }
  unsettle(){
    this._u++;
  }
}

export class Color extends Uint8Array{
  constructor(r,g,b,a,buffer=null,offset=null){
    if(!buffer) super(4);
    else super(buffer, offset, 4);
    this.set([r,g,b,a])
  }
  valueOf(){
    return new DataView(this.buffer, this.byteOffset, 4).getUint32
  }
  tosolidhex(){
    return "#"+tohexpad1(this[0])+tohexpad1(this[1])+tohexpad1(this[2])
  }
}

function tohexpad1(n){
  return n<16?"0"+n.toString(16):n.toString(16)
}


export function b_cc(...bufs){
  let offsets = [];
  let coff = 0
  for(let i=0; i<bufs.length; i++){
    offsets.push(coff);
    coff+=bufs[i].byteLength
  }
  let res = new Uint8Array(coff)
  for(let i=0; i<bufs.length; i++){
    res.set(new Uint8Array(bufs[i].buffer, bufs[i].byteOffset, bufs[i].byteLength),offsets[i])
  }
  return res
}
let b64v = ""
for(let i=65; i<91; i++)b64v+=String.fromCharCode(i);
for(let i=97; i<123; i++)b64v+=String.fromCharCode(i);
for(let i=48; i<58; i++)b64v+=String.fromCharCode(i);
b64v+="+/";
export function toB64(a){
  let str=""; const pad=(3-a.length%3)%3;
  for(let i=0; i<a.length; i+=3){
    let num = (a[i]<<16)+((a[i+1]??0)<<8)+(a[i+2]??0)
    str+=b64v[(num>>18)]+b64v[(num>>12)&0x3f]+b64v[(num>>6)&0x3f]+b64v[(num)&0x3f]
  }
  return str.substring(0,str.length-pad)+"==".substring(0,pad);
}
export function reverseObj(o){
  const r={}
  for(let [key, value] of Object.entries(o)){
    (r[value]??(r[value]=[])).push(key)
  }
  return r;
}