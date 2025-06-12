
import { allreps, codes, InstrWrapper, JumpPoint, JumpTargetWrapper, MAXDEPTH, orderOfOps, RegWrapper, reverseObj, StringWrapper, TOK, TOKRE } from "./intLib.js"

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
    return this.vars[v]??this.parent.getreg(v);
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
    starts[i].forEach(r=>r.reg=s.pop()??(o++))
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
    //console.log([reg,(s?.t===0 && fitsIm(s.c))?s.c:null],m,s);
    return [reg,(s?.t===0 && fitsIm(s.c))?s.c:null]
  }
  const last = queue.pop();
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
  const s=t[last];
  const reg = targetRegs[0]??new RegWrapper(o);
  orderOfOps[s.t].mkinstrs(s,reg,toktoreg,instr);
  for(let i=1; i<targetRegs; i++){
    instr.push([new InstrWrapper("copy"),targetRegs[i],reg])
  }
  return out;
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
        if(l[j][0]=='$')targs.push(new RegWrapper(this.vars[l[j]].reg));
        if(l[j][0]=='@')chset.push(l[j]);
      } 
      const reg = this.compileLine(instrs, targs, l[l.length-1],fitsim)
      chset.forEach(x=>{
        instrs.push([codes.storeChannel,reg,x.length-1,new StringWrapper(x.substring(1))])
      })
      if(i==0 && (this.type=='if'||this.type=='while')){
        instr.push([codes.jz, reg, end.jump()])
      }
    }
  }
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
    const fill = (x)=>{
      if(x instanceof ValueWrapper){
        x.arrAppend(arr,bits)
        if(x instanceof JumpPoint) toFix.push(x);
      } else if(x instanceof Array) {
        x.forEach(fill)
      } else throw Error(`Bad! not a value wrapper ${x}`)
    }
    let dat = this.main.compile([],(n)=>n<1<<(bits-1) && n>=-(1<<(bits-1)))
    console.log(this.lastComp = dat);
    fill(dat)
    toFix.forEach(x=>x.arrFix(arr,bits))
    let highCheck=(1<<bits)-1
    let lowCheck=0
    arr.forEach(x=>{if(x>highCheck||x<lowCheck)throw Error()});
    return arr;
  }
  getreg(v){
    return this.using[v]
  }
}


window.IntProg = IntProg;
window.Stack = Stack;
window.ctrlwrod = Ctrlword