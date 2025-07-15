import {Blocks, Generator} from "blockly";

export const simpleBlock = init => { return {init}; }
export const register = (name, arr, block) => {
    Blocks[name] = block;
    arr.push({kind:"block",type:name});
}

export function statement(name, nextLine, stringList, intList){
    return `${name}${stringList.length>0?`<${stringList}>`:""}(${intList})${!nextLine?"":";\n"}`
}

export function quoted(str){
    if(str[0]=='"') return str;
    return `"${str}"`
}
export const regSimple = (name, res,fn, cg)=>{
    register(name,res, simpleBlock(fn));
    generator.forBlock[name] = cg
}
export const generator = new Generator('AuspiciousScript');