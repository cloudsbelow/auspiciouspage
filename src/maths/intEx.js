//code for 'compiling' simple mathematical statements


const TOK = '([#$]\\w+)'; //([@#%]\w+|&#?\w+&#?\w+)
const TOKRE = new RegExp(TOK,'g');
//const PARENRE = new RegExp(`[a-z]*\\(${TOK}(,${TOK})*\\)`,'g')
const PARENRE = new RegExp(
  '(?:[a-zA-Z_][\\w]*(?:\\<[A-Za-z_]\\w*(?:\\,*[A-Za-z_]\\w*)*\\>)?)?'+
  `\\((${TOK}(,${TOK})*)?\\)`, 'g'
)
const MAXDEPTH = 2000;

const HPTOK = '!T!'

const ValueWrapper = function(v){this.v=v}
Object.setPrototypeOf(ValueWrapper.prototype,null)
ValueWrapper.prototype.valueOf = ()=>0
const StringWrapper = function(v){ValueWrapper.call(this,v)}
StringWrapper.prototype=Object.create(ValueWrapper.prototype)
StringWrapper.prototype.arrAppend = function(arr,bits=8){
  if(bits == 8) for(let i=0; i<this.v.length; i++)arr.push(this.v.charCodeAt(i));
  else throw Error();
}
const IntWrapper = function(v){ValueWrapper.call(this,v)}
IntWrapper.prototype = Object.create(ValueWrapper.prototype);
IntWrapper.prototype.arrAppend = function(arr, bits=8){
  const v = new DataView(new Int32Array([this.v]).buffer)
  if(bits == 8) for(let i=0; i<4; i++)arr.push(v.getUint8(i));
  else throw Error();
}
const ImmIntWrapper = function(v){ValueWrapper.call(this,v)}
ImmIntWrapper.prototype = Object.create(ValueWrapper.prototype);
ImmIntWrapper.prototype.arrAppend = function(arr, bits=8){
  if(bits == 8){
    let varr = new Int8Array([this.v]);
    if(this.v != varr[0]) throw Error("Invalid int8 "+this.v);
    arr.push(new DataView(varr.buffer).getUint8(0));
  }
  else throw Error();
}
const ImmUintWrapper = function(v){ValueWrapper.call(this,v)}
ImmUintWrapper.prototype = Object.create(ValueWrapper.prototype);
ImmUintWrapper.prototype.arrAppend = function(arr, bits=8){
  if(bits == 8){
    let varr = new Uint8Array([this.v]);
    if(this.v != varr[0]) throw Error("Invalid uint8 "+this.v);
    arr.push(new DataView(varr.buffer).getUint8(0));
  }
  else throw Error();
}

const enums=`
    noop, loadZero, loadI, loadImmediateInt, loadChannel, storeChannel, copy,
    startAccInit0, startAccInit1, startAccInitImm, startAccInitReg, startAcc, finishAcc,
    mult, div, mod, add, sub, lshift, rshift, and, or, xor, land, lor, max, min, take,
    multI, divI, modI, addI, subI, lshiftI, rshiftI, andI, orI, xorI, landI, lorI, maxI, minI, takeI,
    eq,ne,le,ge,less,greater, eqI,neI,leI,geI,lessI,greaterI, not, lnot,
    jnz, jz, j, setsptr, setsptrI, loadsptr, iops, iopsi, iopsii, iopss, iopssi, iopssii, iopvsvi
`.replaceAll(/\s/g,"").split(",")
const codes_ = {}
const codes = new Proxy(codes_,{
  get:(targ, p, rec)=>{
    let v = targ[p];
    if(v===undefined) console.error("No code "+p);
    return v;
  }
})
enums.forEach((x,i)=>codes_[x]=i);

function prior(delimiters){
  return `(^|(?<=[(${delimiters}]))`
}
function post(delimiters){
  return `($|(?=[)${delimiters}]))`
}
let delimiters = ","

const startMaybeImmAcc = (first,instrs)=>{
  if(first[1]!==null)instrs.push([codes.startAccInitImm,new ImmIntWrapper(first[1])]);
  else{
    if(first[0]===null || first[0]===undefined) throw Error("bad")
    instrs.push([codes.startAccInitReg,first[0]]);
  }
}
const addMaybeImmInstr = (tuple, op, instrs)=>{
  if(tuple[1]!==null) instrs.push([codes[op+"I"],new ImmIntWrapper(tuple[1])]);
  else{
    if(tuple[0]===null || tuple[0]===undefined) throw Error("bad")
    instrs.push([codes[op],tuple[0]])
  }
  if(!codes[op+(tuple[1]===null?"":"I")]) throw Error("bad")
}
const doSimpleAcc = (op,s,reg,fn,instrs)=>{
  const v=s.expr;let toks = v.match(TOKRE);
  doSimpleAccToks(op,toks,reg,fn,instrs)
}
const doSimpleAccToks = (op,toks,reg,fn,instrs)=>{
  let narr = []; instrs.push(narr)
  startMaybeImmAcc(fn(toks[0]),narr);
  for(let i=1; i<toks.length; i++){
    addMaybeImmInstr(fn(toks[i]),op,narr);
  }
  narr.push([codes.finishAcc,reg]);
}
const simpleImmSwap = (op, reg, first, second, instrs, swapped=0)=>{
  if(swapped>2) throw Error("bad");
  if(first[1]!==null)simpleImmSwap(op,reg,second,first,instrs,swapped++);
  if(second[1]===null) instrs.push([codes[op],reg,first[0],second[0]]);
  else instrs.push([codes[op+"I"],reg,first[0],new ImmIntWrapper(second[1])])
}

const pfuncs={
  max:{
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>Math.max(x,a.gsm(y).c),-Infinity),
    mkinstrs:doSimpleAccToks.bind(null,"max"),
    canimm:true
  },
  min:{
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>Math.min(x,a.gsm(y).c),-Infinity),
    mkinstrs:doSimpleAccToks.bind(null,"min"),
    canimm:true
  },
  take:{
    pconst:(v,a)=>{
      const toks = v.match(TOKRE);
      return a.gsm(toks[a.gsm(toks[0])+1])
    }, mkinstrs:(toks,reg,fn,instrs)=>{
      addMaybeImmInstr(fn(toks[0]),"setsptr",instrs)
      doSimpleAccToks("take",toks.slice(1), reg, fn, instrs)
    },
    canimm:true
  },
  clamp:{
    pconst:(v,a)=>{
      const toks = v.match(TOKRE); if(toks.length!=3) throw Error("bad")
      return Math.max(a.gsm(toks[1]),Math.min(a.gsm(toks[2]),a.gsm(toks[0])))
    },
    mkinstrs:(toks, reg,fn,instrs)=>{
      startMaybeImmAcc(fn(toks[0]),instrs);
      addMaybeImmInstr(fn(toks[1]),"max",instrs)
      addMaybeImmInstr(fn(toks[2]),"min",instrs)
      instrs.push([codes.finishAcc,reg])
    },
    canimm:true
  }
}

const ParenEx = /(?:[a-zA-Z_][\w]*(?:\<[A-Za-z_]\w*(?:\,*[A-Za-z_]\w*)*\>)?)?/

const orderOfOps=[{  
    remid:`(0x|0b)?\\d+`,
    pconst:(v,a)=>v.startsWith('0b')?parseInt(v,v.substring(2)):parseInt(v),
    mkinstrs: (s,reg,fn,instrs)=>instrs.push([codes.loadImmediateInt, reg, new IntWrapper(s.c)])
  },{ 
    re: /\@\w+(?:\[[^\]]*\])?/g
  },{ 
    re:PARENRE,
    pconst:(v,a)=>{
      if(v[0]=="(") return a.gsm(v.match(TOKRE)).c
      return pfuncs[v.match(ParenEx)[0]].pconst(v,a);
    },
    haspconst:(expr)=>{
      const term = expr.match(ParenEx)[0]
      if(pfuncs[term]?.pconst) return true;
      return term == "";
    },
    mkinstrs: (s,reg,fn,instrs)=>{
      const v=s.expr; let toks = v.match(TOKRE)??[];
      const term = v.match(ParenEx)[0]
      if(v[0]=="("){
        let fi=fn(toks[0]);
        instrs.push([codes[(fi[1]!==null?"loadI":"copy")], reg, fi[1]!==null?new ImmIntWrapper(fi[1]):fi[0]]);
      }
      else{
        let op = pfuncs[term]
        if(op) return op.mkinstrs(toks,reg,fn,instrs);
        
        let strs = term.match(/[a-zA-Z_][\w]*/g)
        let expl = strs.length<=2 && toks.length<=2
        let sinstr = expl?[codes["iop"+'s'.repeat(strs.length)+'i'.repeat(toks.length)],reg]:
          [codes["iopvsvi"],reg,new ImmUintWrapper(strs.length),new ImmUintWrapper(toks.length)]
        for(let str of strs){
          sinstr.push(new ImmUintWrapper(str.length),new StringWrapper(str));
        }
        for(let tok of toks){
          sinstr.push(fn(tok)[0])
        }
        instrs.push(sinstr);
      }
    },
    canUseImm: (v)=>{
      return pfuncs[v.match(ParenEx)[0]]?.canimm === true;
    }
  },{ 
    remid:`[\\!\\~]${TOK}`,ndelim:"\\!\\~",
    pconst:(v,a)=>{
      if(v[0]=='!')return a.gsm(v.substring(1)).c==0?1:0
      else return ~a.gsm(v.substring(1)).c
    },
    mkinstrs:(s,reg,fn,instrs)=>{
      const v=s.expr;
      instrs.push([v[0]=='!'?codes.lnot:codes.not,reg,fn(v.substring(1))[0]]);
    }
  },{
    remid:`(${TOK}[\\/\\*\\%])+${TOK}`,ndelim:"\\/\\*\\%",
    pconst:(v,a)=>{
      let toks = v.match(TOKRE); let ops=v.match(/[\*\/\%]/g);
      let s=a.gsm(toks[0]).c;
      for(let i=0; i<ops.length; i++){
        if(ops[i]=="*")s=s*a.gsm(toks[i+1]).c;
        else if(ops[i]=="%")s=s%a.gsm(toks[i+1]).c;
        else if(ops[i]=="/")s=Math.trunc(s/a.gsm(toks[i+1]).c);
        else console.log("bad bad");
      }
      return s;
    }, mkinstrs:(s,reg,fn,instrs)=>{
      const v=s.expr; let toks = v.match(TOKRE); let ops=v.match(/[\*\/\%]/g);
      let narr = []; instrs.push(narr)
      startMaybeImmAcc(fn(toks[0]),narr);
      for(let i=0; i<ops.length; i++){
        addMaybeImmInstr(fn(toks[i+1]),{"%":"mod","/":"div","*":"mult"}[ops[i]],narr);
      }
      narr.push([codes.finishAcc,reg]);
    }
  },{
    remid:`${TOK}?([\\+\\-]${TOK})+`,ndelim:"\\+\\-",
    pconst:(v,a)=>{
      let toks = v.match(TOKRE); let ops=v.substring(1).match(/[\+\-]/g)??[];
      let s=a.gsm(toks[0]).c*(v[0]=='-'?-1:1);
      for(let i=0; i<ops.length; i++){
        if(ops[i]=="+")s=s+a.gsm(toks[i+1]).c;
        else if(ops[i]=="-")s=s-a.gsm(toks[i+1]).c;
        else console.log("bad bad");
      }
      return s;
    }, mkinstrs:(s,reg,fn,instrs)=>{
      const v=s.expr;let toks = v.match(TOKRE); let ops=v.match(/[\+\-]/g)??[];
      let offset = v[0]=='-'?0:1;
      let narr = []; instrs.push(narr)
      if(v[0]=='-')narr.push([codes.startAccInit0]);
      else startMaybeImmAcc(fn(toks[0]),narr)
      for(let i=0; i<ops.length; i++){
        addMaybeImmInstr(fn(toks[i+offset]),{"+":"add","-":"sub"}[ops[i]],narr);
      }
      narr.push([codes.finishAcc,reg]);
    }
  },{
    remid:`(${TOK}[\\x81\\x82])+${TOK}`,rep:[["<<","\x81"],[">>","\x82"]],ndelim:"\\x81\\x82",
    pconst:(v,a)=>{
      let toks = v.match(TOKRE); let ops=v.match(/[\x81\x82]/g);
      let s=a.gsm(toks[0]).c;
      for(let i=0; i<ops.length; i++){
        if(ops[i]=="\x81")s=s<<a.gsm(toks[i]).c;
        else if(ops[i]=="\x82")s=s>>a.gsm(toks[i]).c;
        else console.log("bad bad");
      }
      return s;
    }, mkinstrs:(s,reg,fn,instrs)=>{
      const v=s.expr; let toks = v.match(TOKRE); let ops=v.match(/[\*\/\%]/g);
      let narr = []; instrs.push(narr)
      startMaybeImmAcc(fn(toks[0]),narr);
      for(let i=0; i<ops.length; i++){
        addMaybeImmInstr(fn(toks[i+1]),{"\x81":"lshift","\x82":"rshift"}[ops[i]],narr);
      }
      narr.push([codes.finishAcc,reg]);
    }
  },{
    remid:`${TOK}[\\x83\\x84\\<\\>]${TOK}`,rep:[["<=","\x83"],[">=","\x84"]],ndelim:"\\x83\\x84\\<\\>",
    pconst:(v,a)=>{
      let toks = v.match(TOKRE); let ops=v.match(/[\x83\x84\<\>]/g);
      if(ops[0]=="\x83") return (a.gsm(toks[0]).c <= a.gsm(toks[1]).c)?1:0;
      if(ops[0]=="\x84") return (a.gsm(toks[0]).c >= a.gsm(toks[1]).c)?1:0;
      if(ops[0]=="<") return (a.gsm(toks[0]).c < a.gsm(toks[1]).c)?1:0;
      if(ops[0]==">") return (a.gsm(toks[0]).c > a.gsm(toks[1]).c)?1:0;
    }, mkinstrs:(s,reg,fn,instrs)=>{
      const v=s.expr; let toks = v.match(TOKRE); let ops=v.match(/[\x83\x84\<\>]/g);
      simpleImmSwap({"\x83":"le","\x84":"ge","<":"less",">":"greater"}[ops[0]],reg,fn(toks[0]),fn(toks[1]),instrs);
    }
  },{
    remid:`${TOK}[\\x85\\x86]${TOK}`,rep:[["==","\x85"],["!=","\x86"]],ndelim:"\\x85\\x86",
    pconst:(v,a)=>{
      let toks = v.match(TOKRE); let ops=v.match(/[\x85\x86]/g);
      if(ops[0]=="\x85") return (a.gsm(toks[0]).c == a.gsm(toks[1]).c)?1:0;
      if(ops[0]=="\x86") return (a.gsm(toks[0]).c != a.gsm(toks[1]).c)?1:0;
    }, mkinstrs:(s,reg,fn,instrs)=>{
      const v=s.expr; let toks = v.match(TOKRE); let ops=v.match(/[\x85\x86\<\>]/g);
      simpleImmSwap({"\x85":"eq","\x86":"ne"}[ops[0]],reg,fn(toks[0]),fn(toks[1]),instrs);
    }
  },{
    remid:`(${TOK}\\&)+${TOK}`,ndelim:"\\&",
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>x&a.gsm(y).c, -1), 
    mkinstrs:doSimpleAcc.bind(null,"and"),
  },{
    remid:`(${TOK}\\^)+${TOK}`,ndelim:"\\^",
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>x^a.gsm(y).c, 0),
    mkinstrs:doSimpleAcc.bind(null,"xor"),
  },{
    remid:`(${TOK}\\|)+${TOK}`,ndelim:"\\|",
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>x|a.gsm(y).c, 0),
    mkinstrs:doSimpleAcc.bind(null,"or"),
  },{
    remid:`(${TOK}[\\x87])+${TOK}`,rep:[["&&","\x87"]],ndelim:"\\x87",
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>x&&a.gsm(y).c, true),
    mkinstrs:doSimpleAcc.bind(null,"land"),
  },{
    remid:`(${TOK}[\\x88])+${TOK}`,rep:[["||","\x88"]],ndelim:"\\x88",
    pconst:(v,a)=>v.match(TOKRE).reduce((x,y)=>x||a.gsm(y).c, false),
    mkinstrs:doSimpleAcc.bind(null,"lor"),
  },
]


const allreps=[]
for(let i=orderOfOps.length-1; i>=0; i--){
  const ops = orderOfOps[i];
  if(!ops.re) ops.re = new RegExp(prior(delimiters)+ops.remid+post(delimiters),'g');
  if(ops.ndelim)delimiters+=ops.ndelim;
  ops.rep?.forEach(x=>allreps.push(x));
  ops.t=i;
}

function keyIntersect(...o){
  const idx = Object.keys(o[0]).length<Object.keys(o[1]).length?1:0;
  const res = {}
  Object.keys(o[1-idx]).forEach((key)=>{
    if(o[idx][key] !== undefined) res[key] = true
  })
  return res
}

class IntEx{
  constructor(text){
    this.symmap={}
    this.microt = {} 
    this.macrot = {}
    this.using = []
    this.emitting = []
    this.symcounter = 0

    const lines = text.replaceAll(/\/\/.*$/gm,"").match(/(^|(?<=\;))[^;]*\w[^;]*(?=;)/gm).map(s=>{
      let str = s.replaceAll(/\s/g,"")
      for(let [sub, tok] of allreps){
        str = str.replaceAll(sub, tok);
      }
      return str;
    })
    console.log(lines)
    lines.map(str=>str.split('=')).forEach(([sym,f])=>{
      this.addline(f&&sym, f??sym)
    })
  }
}

IntEx.prototype.gsm = function(tok){
  if(tok[0]=="$") return this.gsm(this.macrot[tok].s)
  return this.microt[tok];
}
IntEx.prototype.ssm = function(tok){
  if(tok[0]=="$") return this.ssm(this.macrot[tok].s)
  return tok;
}
IntEx.prototype.symadd = function(expr, type){
  if(this.symmap[expr]) return this.symmap[expr];
  let insym = [...new Set(type==-1?[]:expr.match(TOKRE))].map(this.ssm.bind(this))
  //console.log(expr, insym);
  const ty = orderOfOps[type];
  if(insym.every(x=>this.gsm(x).t==0) && type!=0 && ty.pconst && (!ty.haspconst||ty.haspconst(expr))){
    return this.symadd(ty.pconst(expr,this).toString(),0);
  }
  const sym = '#'+(++this.symcounter);
  const s = {
    expr:expr, t: type,
    in:insym
  }
  if(type == 1){
    this.using.push([expr,sym]);
  }
  if(type==0) s.c=orderOfOps[0].pconst(expr,this);
  this.symmap[expr] = sym
  this.microt[sym] = s
  return sym
}
IntEx.prototype.symReduce = function(f){
  if(this.symmap[f]) return this.symmap[f]
  let forig=f;
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
        return this.symmap[forig]=final
      } else {
        throw console.error("Parse error", f)
      }
    }
    let nf=""; let lidx=0;
    m.forEach(x=>{
      nf+=f.substring(lidx,x.index)+this.symadd(x[0],t)
      lidx=x.index+x[0].length
    })
    f=nf+f.substring(lidx);
  }
}
IntEx.prototype.addline = function(sym, f){
  //console.log(sym,f)
  let macroin = [...new Set(f.match(TOKRE))]
  let s = this.symReduce(f)
  let o = {
    s:s, in:macroin, sym:sym
  };
  if(sym==null||sym[0]=="@") this.emitting.push(o)
  if(sym!=null)this.macrot[sym]=o
}
function reverseObj(o){
  const r={}
  for(let [key, value] of Object.entries(o)){
    (r[value]??(r[value]=[])).push(key)
  }
  return r;
}
IntEx.prototype.compileout = function(bits=8,verbose=false){
  
  const lastused = {}
  const queue = []
  const tobase = (m)=>m[0]=="$"?this.macrot[m].s:m;
  const fitsIm = (n)=>n<1<<(bits-1) && n>=-(1<<(bits-1))
  const enqdep = (m)=>{
    m=tobase(m)
    if(lastused[m]) return;
    const s=this.microt[m]
    if(s.t==1) return;
    const ci=orderOfOps[s.t].canUseImm?.(s.expr)??true;
    const use = []
    s.in.forEach((n)=>{
      n=tobase(n)
      if(ci && this.microt[n].t==0 && fitsIm(this.gsm(n).c))return;
      enqdep(n);
      use.push(n);
    });
    queue.push(m)
    use.forEach(x=>lastused[x]=queue.length)
  }
  this.emitting.forEach((x  ,i)=>{
    enqdep(x.s);
    if(x.sym?.[0]=="@"){
      queue.push(x.sym);
    }
    lastused[tobase(x.s)]=queue.length;
  })
  console.log(queue);

  const freed=[]
  let next = this.using.length;
  const regs={}
  this.using.forEach(([r,sym],i)=>{
    delete lastused[sym];
    regs[sym]=i;
  })
  const release = reverseObj(lastused);

  //return;
  let instr = []
  const toktoreg = (m)=>{
    let s=this.gsm(m);
    return [regs[tobase(m)],(s.t==0 && fitsIm(s.c))?s.c:null]
  }
  queue.forEach((x,i)=>{
    if(x[0] == '@'){
      instr.push([codes.storeChannel,regs[tobase(this.macrot[x].s)],x.length-1,new StringWrapper(x.substring(1))])
      return
    }
    const s=this.microt[x];
    const reg = freed.pop()??next++;
    orderOfOps[s.t].mkinstrs.call(this,s,reg,toktoreg,instr);
    regs[x]=reg;
    release[i]?.forEach(m => {
      freed.push(regs[m]);
      regs[m]=null;
    });
  })
  //console.log(instr)
  let final=[];
  let fail=false;
  const farr=(arr)=>{
    arr.forEach(x => {
      if(Array.isArray(x)) return farr(x);
      if(x instanceof ValueWrapper) return x.arrAppend(final)
      if(x===null || x===undefined || x>=1<<bits) return fail=true;
      final.push(x)
    });
  }
  try{
    farr(instr)
  }catch(ex){
    console.error(ex);
    fail=true;
  }
  if(verbose){
    console.log(instr)
    console.log(final)
  }
  return fail?null:[new Uint8Array(final),next]
}



//let a=new IntEx("@b = take(@0,clamp(@1,@3,max(1,2,3)),@1,2)")
//console.log(a.compileout())
function b_cc(...bufs){
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
function toB64(a){
  let str=""; const pad=(3-a.length%3)%3;
  for(let i=0; i<a.length; i+=3){
    let num = (a[i]<<16)+((a[i+1]??0)<<8)+(a[i+2]??0)
    str+=b64v[(num>>18)]+b64v[(num>>12)&0x3f]+b64v[(num>>6)&0x3f]+b64v[(num)&0x3f]
  }
  return str.substring(0,str.length-pad)+"==".substring(0,pad);
}
const qcomp=(ex, bits=8)=>{
  let a = new IntEx(ex);
  if(a == null){
    alert("failed");
    return;
  }
  window.mostrecent = a;
  let b=a.compileout(8,true);
  //console.log(b);
  if(b[1]>=256) throw Error("Your program needs more than 256 registers. Please wait for 16-bit support.");
  let header = new Uint16Array([1,a.using.length,b[1],0])
  let c=[header, new Uint32Array([b[0].byteLength])]
  let offset = 12;
  a.using.forEach(([x,s])=>{
    x=x.substring(1)
    c.push(new Uint8Array([x.length]));
    let d=new TextEncoder().encode(x);
    if(d.byteLength != x.length || x.length>(1<<bits)-1) throw Error("bad channel name: "+x);
    c.push(d)
    offset+=1+x.length;
  })
  c.push(b[0])
  header[3]=offset;
  //console.log(c,b_cc(...c));
  return toB64(b_cc(...c));
}

const e = document?.getElementById("Compileplease") 
if(e)e.onclick = ()=>{
  let s;
  try{
    s=qcomp(document.getElementById("compilerin").value)
    navigator.clipboard.writeText(s)
    alert("Success. Copied to clipboard (or I tried to at least). \n"+s);
  } catch(err){
    alert("Failed. The error was "+err+" (not very helpful but probably better than what I get from hlsl)"); throw(err);
  }
}
  
  
  
  
  
  
  
  
  
  
  
  
  