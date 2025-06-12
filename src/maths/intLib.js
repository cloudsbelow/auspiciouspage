export const TOK = '([#$]\\w+)'; //([@#%]\w+|&#?\w+&#?\w+)
export const TOKRE = new RegExp(TOK,'g');
//const PARENRE = new RegExp(`[a-z]*\\(${TOK}(,${TOK})*\\)`,'g')
export const PARENRE = new RegExp(
  '(?:[a-zA-Z_][\\w]*(?:\\<[A-Za-z_]\\w*(?:\\,*[A-Za-z_]\\w*)*\\>)?)?'+
  `\\((${TOK}(,${TOK})*)?\\)`, 'g'
)
export const MAXDEPTH = 2000;

export const ValueWrapper = function(v){this.v=v}
Object.setPrototypeOf(ValueWrapper.prototype,null)
ValueWrapper.prototype.valueOf = ()=>0
ValueWrapper.prototype.arrAppend = function(arr, bits){
  throw new Error("not implemented")
}
export const StringWrapper = function(v){ValueWrapper.call(this,v)}
StringWrapper.prototype=Object.create(ValueWrapper.prototype)
StringWrapper.prototype.arrAppend = function(arr,bits=8){
  if(bits == 8) for(let i=0; i<this.v.length; i++)arr.push(this.v.charCodeAt(i));
  else throw Error();
}
export const IntWrapper = function(v){ValueWrapper.call(this,v)}
IntWrapper.prototype = Object.create(ValueWrapper.prototype);
IntWrapper.prototype.arrAppend = function(arr, bits=8){
  const v = new DataView(new Int32Array([this.v]).buffer)
  if(bits == 8) for(let i=0; i<4; i++)arr.push(v.getUint8(i));
  else throw Error();
}
export const ImmIntWrapper = function(v){ValueWrapper.call(this,v)}
ImmIntWrapper.prototype = Object.create(ValueWrapper.prototype);
ImmIntWrapper.prototype.arrAppend = function(arr, bits=8){
  if(bits == 8){
    let varr = new Int8Array([this.v]);
    if(this.v != varr[0]) throw Error("Invalid int8 "+this.v);
    arr.push(new DataView(varr.buffer).getUint8(0));
  }
  else throw Error();
}
export const ImmUintWrapper = function(v){ValueWrapper.call(this,v)}
ImmUintWrapper.prototype = Object.create(ValueWrapper.prototype);
ImmUintWrapper.prototype.arrAppend = function(arr, bits=8){
  if(bits == 8){
    let varr = new Uint8Array([this.v]);
    if(this.v != varr[0]) throw Error("Invalid uint8 "+this.v);
    arr.push(new DataView(varr.buffer).getUint8(0));
  }
  else throw Error();
}
export const JumpTargetWrapper = function(name){ValueWrapper.call(this, name)}
JumpTargetWrapper.prototype = Object.create(ValueWrapper.prototype);
JumpTargetWrapper.prototype.jump = function(){
  return new JumpPoint(this)
}
JumpTargetWrapper.prototype.arrAppend = function(arr,bits=8){
  this.loc = arr.length;
}
export const JumpPoint = function(target){ValueWrapper.call(this, target)}
JumpPoint.prototype = Object.create(ValueWrapper.prototype);
JumpPoint.prototype.arrAppend = function(arr, bits=8){
  if(this._fof === undefined){
    this._fof = arr.length;
  } else throw Error("the same jump point is used in multiple places")
  if(bits == 8)for(let i=0; i<4; i++)arr.push(-1);
  else throw Error();
}
JumpPoint.prototype.arrFix = function(arr, bits=8){
  if(bits == 8 && this._fof!==undefined){
    const v = new DataView(new Uint32Array([this.v.loc]).buffer)
    for(let i=0; i<4; i++)arr[this._fof+i] = v.getUint8(i);
  }
  else throw Error();
}
export const RegWrapper = function(reg){ValueWrapper.call(this, reg)}
RegWrapper.prototype = Object.create(ValueWrapper.prototype);
RegWrapper.prototype.arrAppend = function(arr, bits=8){
  if(bits == 8){
    let varr = new Uint8Array([this.v]);
    if(this.v != varr[0]) throw Error("Invalid register "+this.v+" (255 is the maximum register number for now)");
    arr.push(new DataView(varr.buffer).getUint8(0));
  }
  else throw Error();
}

const codes_ = {}
export const InstrWrapper = function(instr){ValueWrapper.call(this, instr)}
InstrWrapper.prototype = Object.create(ValueWrapper.prototype);
InstrWrapper.prototype.arrAppend = function(arr, bits=8){
  if(bits == 8){
    let v = codes_[this.v];
    if(v===undefined) throw new Error("No code "+this.v);
    arr.push(v);
  }
  else throw Error();
}

export const enums=`
    noop, loadZero, loadI, loadImmediateInt, loadChannel, storeChannel, copy,
    startAccInit0, startAccInit1, startAccInitImm, startAccInitReg, startAcc, finishAcc,
    mult, div, mod, add, sub, lshift, rshift, and, or, xor, land, lor, max, min, take,
    multI, divI, modI, addI, subI, lshiftI, rshiftI, andI, orI, xorI, landI, lorI, maxI, minI, takeI,
    eq,ne,le,ge,less,greater, eqI,neI,leI,geI,lessI,greaterI, not, lnot,
    jnz, jz, j, setsptr, setsptrI, loadsptr, iops, iopsi, iopsii, iopss, iopssi, iopssii, iopvsvi, yield, yieldI, exit
`.replaceAll(/\s/g,"").split(",")
export const codes = new Proxy(codes_,{
  get:(targ, p, rec)=>{
    let v = targ[p];
    if(v===undefined) console.error("No code "+p);
    return new InstrWrapper(p);
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

/**
 * @param {*} first Tuple containing register/immidiate if it exists
 * @param {Array} instrs Instruction array to append to
 */
const startMaybeImmAcc = (first,instrs)=>{
  if(first[1]!==null)instrs.push([codes.startAccInitImm,new ImmIntWrapper(first[1])]);
  else{
    if(first[0]===null || first[0]===undefined) throw Error("bad")
    instrs.push([codes.startAccInitReg,first[0]]);
  }
}
/**
 * @param {*} tuple Tuple containing register/immidiate if it exists
 * @param {*} op Opcode to add
 * @param {*} instrs Instruction array to append to
 */
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
/**
 * @param {*} op Operation to accumulate
 * @param {*} toks Tokens to parse
 * @param {*} reg The out register
 * @param {*} fn Function to generate register/immidiate tuple
 * @param {*} instrs Instruction array to append to
 */
const doSimpleAccToks = (op,toks,reg,fn,instrs)=>{
  let narr = []; instrs.push(narr)
  startMaybeImmAcc(fn(toks[0]),narr);
  for(let i=1; i<toks.length; i++){
    addMaybeImmInstr(fn(toks[i]),op,narr);
  }
  narr.push([codes.finishAcc,reg]);
}
/**
 * @param {*} op Operation to perform
 * @param {*} reg Output register
 * @param {*} first Fist value to use
 * @param {*} second Second value to use
 * @param {*} instrs Instruction array to append to
 * @param {*} swapped Internal - leave empty
 */
const simpleImmSwap = (op, reg, first, second, instrs, swapped=0)=>{
  if(swapped>2) throw Error("bad");
  if(first[1]!==null)simpleImmSwap(op,reg,second,first,instrs,swapped++);
  if(second[1]===null) instrs.push([codes[op],reg,first[0],second[0]]);
  else instrs.push([codes[op+"I"],reg,first[0],new ImmIntWrapper(second[1])])
}

/**
 * Compiled parenthetical instructions. 
 */
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
  },
  wait:{
    mkinstrs:(toks,reg,fn,instrs)=>{
      addMaybeImmInstr(fn(toks[0]),"yield",instrs)
    },
    canimm:true
  }
}

const ParenEx = /(?:[a-zA-Z_][\w]*(?:\<[A-Za-z_]\w*(?:\,*[A-Za-z_]\w*)*\>)?)?/

export const orderOfOps=[{  
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
export const allreps=[]
for(let i=orderOfOps.length-1; i>=0; i--){
  const ops = orderOfOps[i];
  if(!ops.re) ops.re = new RegExp(prior(delimiters)+ops.remid+post(delimiters),'g');
  if(ops.ndelim)delimiters+=ops.ndelim;
  ops.rep?.forEach(x=>allreps.push(x));
  ops.t=i;
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


