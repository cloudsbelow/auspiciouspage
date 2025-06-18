export class substituteTemplate{
  constructor(){}
}
export class _subidx extends substituteTemplate{
  constructor(index){
    super();
    this.index=index
  }
  mk(subs,refs){
    let idx=manifest(this.index,subs,refs)
    if(Array.isArray(idx)){
      let obj=subs;
      for(let i=0; i<idx.length; i++){
        obj=obj[manifest(idx[i],subs,refs)]
        if(!obj) return;
      }
      return obj;
    }
    return idx===undefined?subs:subs[idx]
  }
}
export class deferedstring extends substituteTemplate{
  constructor(args,delimiter=""){
    super()
    this.delimiter = delimiter;
    this.args=args
  }
  mk(subs,refs){
    let str=""
    let elems = manifest(this.args,subs,refs)
    for(let i=0; i<elems.length; i++){
      if(i>0) str+=this.delimiter;
      let val=elems[i];
      str+=manifest(val,subs,refs);
    }
    return str;
  }
}
export class _breffn extends substituteTemplate{
  constructor(func,...args){
    super()
    this.func=func
    this.args=args
  }
  mk(subs,refs){
    return this.func.bind(refs,...this.args.map(a=>manifest(a,subs,refs)))
  }
}
export class htmltemplate extends substituteTemplate{
  static alias={
    className:["classes"],classes:["classes"],cn:["classes"],class:["classes"],
    c:["c"],children:["c"],child:["c"],
    id:["id"], tc:["p", "textContent"],
    bg:["s","backgroundColor"],
    width:["s","width"], w:["s","width"],
    height:["s","height"], h:["s","height"],
    top:["s","top"],left:["s","left"],
    styles:["s"],style:["s"],
    e:["e"],elem:["e"],
    ref:["ref"],
    md:["p","onmousedown"],press:["p","onmousedown"],onpress:["p","onmousedown"],
    click:["p","onclick"],
    wheel:["l","wheel"],
  }
  constructor(descr){
    super()
    this.p={};
    this.s={};
    this.l={};
    for(const [key, val] of Object.entries(descr)){
      let m = htmltemplate.alias[key];
      if(Array.isArray(m)){
        let obj=this;
        for(let i=0; i<m.length-1; i++) obj=obj[m[i]]??(obj[m[i]]={});
        obj[m[m.length-1]]=val;
      } else {
        this.p[key]=val;
      }
    }
  }
  mk(subs,refs){
    const e = document.createElement(this.e??div);
    if(this.classes) e.className = manifest(this.classes,subs,refs);
    if(this.id) e.id = manifest(this.id,subs,refs);
    if(this.ref) setref(e,this.ref,subs,refs);
    for(const [key, val] of Object.entries(this.p)){
      e[key]=manifest(val,subs,refs);
    }
    for(const [key, val] of Object.entries(this.s)){
      e.style[key]=manifest(val,subs,refs)
    }
    for(const [key,val] of Object.entries(this.l)){
      const t=manifest(val,subs,refs)
      const arr=Array.isArray(t)?t:[t]
      for(const fn of arr) e.addEventListener(key,manifest(fn,subs,refs));
    }
    if(this.c){
      const c = manifest(this.c,subs,refs)
      //console.log(c)
      if(Array.isArray(c))c.forEach((cd)=>{
        e.appendChild(manifest(cd,subs,refs))
      });
      else{
        e.appendChild(manifest(c,subs,refs))
      }
    }
    return e;
  }
}
export class _div extends htmltemplate{
  constructor(descr){
    super(descr);
    this.e="div"
  }
}
function setref(val,ref,subs,refs){
  ref=manifest(ref,subs,refs)
  if(Array.isArray(ref)){
    let obj=refs;
    for(let i=0; i<ref.length-1; i++){
      let t=manifest(ref[i],subs,refs)
      obj=obj[t]??(obj[t]={})
    } 
    obj[ref[ref.length-1]]=val
  } else {
    refs[ref]=val
  }
}
function manifest(val,subs,refs){
  while(val instanceof substituteTemplate){
    val = val.mk(subs,refs)
  }
  return val;
}