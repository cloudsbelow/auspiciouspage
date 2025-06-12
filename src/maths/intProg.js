
import { allreps, b_cc, codes, enums, ImmUintWrapper, InstrWrapper, JumpPoint, JumpTargetWrapper, MAXDEPTH, orderOfOps, RegWrapper, reverseObj, StringWrapper, toB64, TOK, TOKRE, ValueWrapper } from "./intLib.js"

class Stack extends Array{peek(){return this[this.length-1]}empty(){return this.length==0};}

class Scope{
  constructor(entry, parent){
    this.entry = entry;
    this.parent = parent;
    this.items = []
    this.vars = {}
    if(this.entry == "")return;
    if(this.entry == "else"){
      this.type = "else"; return;
    }
    let match = this.entry.match(/^(\w*)\((.+)\)$/)
    if(match == null) throw new Error(`improper loop clause ${this.entry}`);
    let [all, type, inner] = match;
    this.type = type;
    if(type!="if"&&type!="while") throw new Error(`Unknown block type ${type}`);
    this.items.push(inner);
  }
  add(item){
    this.items.push(item);
  }
  setvar(v, thislvl=false){
    if(this.parent?.usevar(v)) return;
    this.vars[v] = {start:this.i}
  }
  usevar(v){
    const l=this.vars[v]
    if(l!=undefined){
      if(l[0]<=this.i.start) throw new Error(`use of unassigned variable ${v}`);
      l.lastused=this.i;
      return true;
    }
    return this.parent?.usevar(v)
  }
  getreg(v){
    return this.vars[v]?.reg??this.parent.getreg(v);
  }
}
class Ctrlword{
  constructor(word){this.word=word}
  static words = new Set(["continue","break","return","yield","exit"]);
}

Scope.prototype.build = function(ctx){
  this.i=0;
  const nitems = [];
  for(const p of this.items){
    if(p==="") continue;
    if(p instanceof Scope){
      this.i = nitems.push(p); continue;
    }
    if(Ctrlword.words.has(p)){
      nitems.push(new Ctrlword(p)); continue;
    }

    let ph =p.match(/[^=]+(?=\=|$)/g)
    if(ph==null) throw new Error(`invalid line ${p}`);
    for(let i=0; i<ph.length-1; i++){
      if(ph[i].match(/^\@\w+(?:\[[^\]]*\])?$/)) continue;
      else if(ph[i].match(/^\$\w+$/)) this.setvar(ph[i]);
      else throw new Error(`Invalid lvalue ${ph[i]}`)
    }
    this.i = nitems.push(ph);
  }
  this.i=0;
  this.items=nitems;
  for(;this.i<nitems.length; this.i++){
    const p = nitems[this.i]
    if(p instanceof Scope){
      p.build(ctx)
    } else {
      if(p instanceof Ctrlword) continue;
      const rv = p[p.length-1];
      rv.match(/\$\w+/g)?.forEach((v)=>{
        if(!this.usevar(v)) throw new Error(`use of undeclared variable ${v}`)
      });
      rv.match(/\@\w+(?:\[[^\]]*\])?/g)?.forEach(ctx.addChannel.bind(ctx))
    }
  }
  delete this.i;
}
Scope.prototype.assignReg = function(offset){
  const n = this.items.length;
  const starts = Array.from({length:n},()=>[])
  const ends = Array.from({length:n},()=>[])
  for(const [v, range] of Object.entries(this.vars)){
    starts[range.start].push(range);
    ends[range.lastused??range.start].push(range);
  }
  let o=offset;
  let s = new Stack()
  for(let i=0; i<n; i++){
    starts[i].forEach(r=>r.reg=s.pop()??(new RegWrapper(o++)))
    ends[i].forEach(r=>s.push(r.reg));
  }
  for(const p of this.items) if(p instanceof Scope) p.assignReg(o);
  this.highestOffset = o;
}
Scope.prototype.compileLine = function(instr, targetRegs, command, fitsIm){
  const syms = {}
  const t = {};
  const gsm = (sym)=>t[sym]
  const tosym = {gsm:gsm}
  let symcounter = 0;
  function symadd(expr, type){
    if(syms[expr]) return syms[expr];
    let insym = [...new Set(type==-1?[]:expr.match(TOKRE))]
    //console.log(expr, insym);
    const ty = orderOfOps[type];
    if(insym.every(x=>gsm(x)?.t===0) && type!=0 && ty.pconst && (!ty.haspconst||ty.haspconst(expr))){
      return symadd(ty.pconst(expr,tosym).toString(),0);
    }
    const sym = '#'+(++symcounter);
    const s = {
      expr:expr, t: type, in:insym
    }
    if(type==0) s.c=orderOfOps[0].pconst(expr,null);
    syms[expr] = sym
    t[sym] = s
    return sym
  }

  let f=command;
  let out;
  for(let i=0; i<MAXDEPTH; i++){
    let t=0; let m=null;
    for(let op of orderOfOps){
      if((m=[...f.matchAll(op.re)]).length !=0){
        t=op.t; break;
      };
    }
    if(m.length == 0){
      let final = f.match(new RegExp(`^${TOK}$`))?.[0]
      if(final){
        out =final; break;
      } else {
        throw console.error("Parse error", f)
      }
    }
    let nf=""; let lidx=0;
    m.forEach(x=>{
      nf+=f.substring(lidx,x.index)+symadd(x[0],t)
      lidx=x.index+x[0].length
    })
    f=nf+f.substring(lidx);
  } 


  const lastused = {}
  const queue = []
  const enqdep = (m)=>{
    if(lastused[m] || m[0]=="$") return;
    const s=t[m]
    if(s.t==1) return;
    const ci=orderOfOps[s.t].canUseImm?.(s.expr)??true;
    const use = []
    s.in.forEach((n)=>{
      if(ci && gsm(n)?.t===0 && fitsIm(gsm(n).c))return;
      if(gsm(n)?.t===1) return;
      enqdep(n);
      use.push(n);
    });
    queue.push(m)
    use.forEach(x=>lastused[x]=queue.length)
  }
  enqdep(out)
  lastused[out]=queue.length;
  const release = reverseObj(lastused);

  const regs={}
  const freed=[]
  let o = this.highestOffset;
  const toktoreg = (m)=>{
    let s=gsm(m);
    let reg=regs[m];
    if(s?.t===1)reg = this.getreg(s.expr);
    if(s==undefined) reg=this.getreg(m)
    return [reg,(s?.t===0 && fitsIm(s.c))?s.c:null]
  }
  //console.log(command,queue)
  let last = queue.pop();
  queue.forEach((x,i)=>{
    const s=t[x];
    const reg = freed.pop()??new RegWrapper(o++);
    orderOfOps[s.t].mkinstrs(s,reg,toktoreg,instr);
    regs[x]=reg;
    release[i]?.forEach(m => {
      freed.push(regs[m]);
      regs[m]=null;
    });
  })
  let reg;
  let firsttarg=1
  if(last!=undefined){
    const s=t[last];
    reg = targetRegs[0]??new RegWrapper(o);
    orderOfOps[s.t].mkinstrs(s,reg,toktoreg,instr);
  } else {
    if(this.getreg(command)!=null) reg=this.getreg(command);
    else throw new Error(`could not compile ${command}`);
    firsttarg=0
  }
  for(let i=firsttarg; i<targetRegs.length; i++){
    instr.push([new InstrWrapper("copy"),targetRegs[i],reg])
  }
  return reg;
}
Scope.prototype.compile = function(instrs, fitsim,iftarg=null){
  let start = new JumpTargetWrapper(`scope begin ${this.type}`);
  let end = new JumpTargetWrapper(`scope end ${this.type}`);
  instrs.push(start);
  if(this.type=='else'){
    instrs.push([codes.j,end.jump(),iftarg])
  }
  for(let i=0; i<this.items.length; i++){
    const l = this.items[i];
    if(l instanceof Scope){
      const ni = [];
      let iftarg=null;
      if(l.type == 'else'){
        if(this.items[i-1]?.type!='if') throw Error(`else must follow if`);
        iftarg = instrs[instrs.length-1].pop();
      }
      instrs.push(ni);
      l.compile(ni,fitsim,iftarg)
    } else if(l instanceof Ctrlword){
      if(l.word == 'return' || l.word == 'exit') instrs.push(codes.exit);
      else if((l.type == 'while'||l.type == 'if') && i==0) throw Error("bad loop condition")
      else if(l.word == 'continue' || l.word=='break'){
        if(this.type == 'while' || this.type =='loop'){
          instrs.push([codes.j,(l.word=='continue'?start:end).jump()]);
        } else throw new Error(`cannot use ${l.word} in ${this.type}`);
      }
    } else {
      let targs =[]
      let chset =[]
      for(let j=0; j<l.length-1; j++){
        if(l[j][0]=='$')targs.push(this.getreg(l[j]));
        if(l[j][0]=='@')chset.push(l[j]);
      } 
      const reg = this.compileLine(instrs, targs, l[l.length-1],fitsim)
      chset.forEach(x=>{
        instrs.push([codes.storeChannel,reg,new ImmUintWrapper(x.length-1),new StringWrapper(x.substring(1))])
      })
      if(i==0 && (this.type=='if'||this.type=='while')){
        instrs.push([codes.jz, reg, end.jump()])
      }
    }
  }
  if(this.type=='while'||this.type=='loop')instrs.push([codes.j, start.jump()]);
  instrs.push(end);
}


const escmap = {
  "(":")", "[":"]", "{":"}"
}
const closechars = new Set(Object.values(escmap))
class IntProg{
  constructor(text){
    this.using = {}
    this.usingctr = 0;
    const prog  = text.replaceAll(/\/\/.*$/gm,"").replaceAll(/\s/gm,"");
    let str = prog;
    for(let [sub, tok] of allreps){
      str = str.replaceAll(sub, tok);
    }
    const un = new Stack()
    const idx =0;
    let cur = "";
    const s = new Stack()
    s.push(new Scope("",null))
    for(let idx=0; idx<str.length; idx++){
      const c = str[idx];
      if(c=="}"){
        if(cur!="" || !un.empty()) throw new Error(`Incomplete line ${cur} before }`);
        const top = s.pop()
        s.peek().add(top);
        continue
      } 
      if(c == ";"){
        if(!un.empty()) throw new Error(`Unbalanced brackets before ; at ${cur}`);
        if(s.peek().add(cur));
        cur="";
        continue;
      }
      if(c == "{"){
        if(!un.empty()) throw new Error(`Unbalanced brackets before { at ${cur}`);
        s.push(new Scope(cur,s.peek()));
        cur = "";
        continue;
      }
      if(escmap[c]!==undefined){
        un.push(escmap[c]);
      }else if(closechars.has(c)){
        if(un.pop()!=c) throw new Error(`Invalid program- asymetric closing brace ${c} after ${cur}`);
      }
      cur+=c;
    }
    if(s.length!=1||cur!=""||!un.empty()) throw new Error(`Invalid program-${s.length-1} unclosed scopes`);
    const scope = this.main = s.pop();
    scope.build(this)
    scope.assignReg(this.usingctr)
    scope.parent = this;
  }
  addChannel(ch){
    this.using[ch]??=this.usingctr++
  }
  compile(bits=8){
    const arr = []
    const toFix=[]
    let highreg = this.usingctr;
    const fill = (x)=>{
      if(x instanceof ValueWrapper){
        x.arrAppend(arr,bits)
        if(x instanceof JumpPoint) toFix.push(x);
        if(x instanceof RegWrapper) highreg=Math.max(highreg,x.v)
      } else if(x instanceof Array) {
        x.forEach(fill)
      } else throw Error(`Bad! not a value wrapper ${x}`)
    }
    let instrs =[]
    this.main.compile(instrs,(n)=>n<1<<(bits-1) && n>=-(1<<(bits-1)))
    console.log(this.lastComp = instrs);
    fill(instrs)
    toFix.forEach(x=>x.arrFix(arr,bits))
    arr.forEach(x=>{if(x>((1<<bits)-1)||x<0)throw Error()});
    if(bits == 8){
      return [new Uint8Array(arr),highreg+1]
    }
  }
  getreg(v){
    return new RegWrapper(this.using[v])
  }
}


const pcomp=(ex, bits=8)=>{
  let a = window.lastprog = new IntProg(ex);
  let b=a.compile(8);
  const using = []
  for(const [ch, reg] of Object.entries(a.using)) using[reg]=ch
  let header = new Uint16Array([1,using.length,b[1],0])
  let c=[header, new Uint32Array([b[0].byteLength])]
  let offset = 12;
  using.forEach(x=>{
    x=x.substring(1)
    c.push(new Uint8Array([x.length]));
    let d=new TextEncoder().encode(x);
    if(d.byteLength != x.length || x.length>(1<<bits)-1) throw Error("bad channel name: "+x);
    c.push(d)
    offset+=1+x.length;
  })
  c.push(b[0])
  header[3]=offset;
  console.log(c);
  return toB64(b_cc(...c));
}
window.pcomp = pcomp;
window.IntProg = IntProg;
window.enums = enums
window.b_cc = b_cc