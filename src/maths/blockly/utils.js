import {Blocks} from "blockly";

export const simpleBlock = init => { return {init}; }
export const register = (name, arr, block) => {
    Blocks[name] = block;
    arr.push({kind:"block",type:name});
}
