import {Generator} from "blockly";
import { operatorMap, operators } from "./statement";
import { statement, generator, quoted } from "./utils";


const Order = {//TODO
    ATOMIC: 0,
    NONE:999
};

//### control
export function initGen(){
generator.forBlock["program_header"] = _=>"";
generator.forBlock['ahc_if'] = function(block) {
    // If/elseif/else condition. copied from https://github.com/google/blockly/blob/afe53c5194e13fc4356b240d9ff0652e74f7ed7c/generators/javascript/logic.ts

    let n = 0;
    let code = '';
    do {
        code +=`${n>0?"else ":""}if(${
            generator.valueToCode(block, 'IF' + n, Order.NONE) || '0'}){\n${
            generator.statementToCode(block, 'DO' + n)}}`;
        n++;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
        code +=`else{\n${block.getInput('ELSE')
            ? generator.statementToCode(block, 'ELSE')
            : ''}}`;
    }
    return code + '\n';
}
generator.forBlock['ahc_while'] = function(block) {
    return `while(${generator.valueToCode(block, 'CONDITION', Order.NONE) || "0"}){\n${
        generator.statementToCode(block, 'CODE')}}\n`;
}
generator.forBlock['ahc_break'] = function(block) {
    return `break;\n`;
}
generator.forBlock['ahc_continue'] = function(block) {
    return `continue;\n`;
}
generator.forBlock['ahc_exit'] = function(block) {
    return `return;\n`;
}
generator.forBlock['ahc_wait'] = function(block) {
    return statement("wait", true,
        [], [generator.valueToCode(block, 'CS', Order.ATOMIC)||0]);
}

//### statement

generator.forBlock['ahs_print'] = function(block, generator) {//todo
    //todo: mutator
    const values = [];
    for (let i = 0; i < block.itemCount_; i++) {
        const valueCode = generator.valueToCode(block, 'VALUE' + i,
            Order.ATOMIC);
        if (valueCode) {
            values.push(valueCode);
        }
    }
    return [statement("print", true,
        [block.getFieldValue('TEXT')],
        values), Order.ATOMIC];
}
generator.forBlock['ahs_number'] = function(block) {
    return [(block.getFieldValue('VALUE')||0)+"", 0];
}
generator.forBlock['ahs_channel'] = function (block) {
    return [`@${block.getFieldValue('NAME')}`, 0];
}
generator.forBlock['ahs_variable'] = function(block) {
    return [`$${block.getFieldValue('NAME')}`, 0];
}
generator.forBlock['ahs_flag'] = function(block) {
    return [statement("getFlag", false,
        [quoted(block.getFieldValue('NAME'))],
        []), Order.ATOMIC];
}
generator.forBlock['ahs_set_flag'] = function(block) {
    return statement("setFlag", true,
        [quoted(block.getFieldValue('FLAG'))],
        [generator.valueToCode(block, 'VALUE', Order.NONE)||0]);
}
generator.forBlock['ahs_counter'] = function(block) {
    return [statement("getCounter", false,
        [quoted(block.getFieldValue('COUNTER'))],
        []), Order.ATOMIC];
}
generator.forBlock['ahs_set_counter'] = function(block) {
    return statement("setCounter", true,
        [quoted(block.getFieldValue('COUNTER'))],
        [generator.valueToCode(block, 'VALUE', Order.NONE)||0]);
}
generator.forBlock['ahs_set'] = function(block) {
    const toSet = generator.valueToCode(block, 'SET', Order.NONE);
    return !toSet?"":`${toSet} = ${
        generator.valueToCode(block, 'VALUE', Order.NONE)||0};\n`;
}
generator.forBlock['ahs_op'] = function(block) {
    const [op, oop]=operatorMap[block.getFieldValue('NAME')];
    return [`${generator.valueToCode(block, 'ARG1', oop)||0} ${op} ${generator.valueToCode(block, 'ARG2', oop)||0}`, oop];
}
generator.forBlock['ahs_not'] = function(block) {
    return [`${block.getFieldValue("NAME")}(${
        generator.valueToCode(block, 'ARG', 1)||0})`, 1];
}

///### ingame

generator.forBlock['ahs_time_since_trans'] = function(block) {
    return [statement("timeSinceTrans",false,[],[]), Order.ATOMIC];
}

generator.forBlock['ahs_has_berry'] = function(block) {
    return [statement("hasBerry", false,
        [generator.valueToCode(block, 'ROOM', Order.ATOMIC)],
        [generator.valueToCode(block, 'VALUE', Order.ATOMIC)||0]), Order.ATOMIC];
}
generator.forBlock['ahs_get_coremode'] = function(block) {
    return [statement("getCoreMode", false,
        [],
        []), Order.ATOMIC];
}
generator.forBlock['ahs_set_coremode'] = function(block) {
    return statement("setCoreMode", true,
        [],
        [generator.valueToCode(block, 'VALUE', Order.NONE)||0]);
}
const propMap = {
    SPEEDX:[["speedx"]],
    SPEEDY:[["speedy"]],
    POSITIONX:[["posx"]],
    POSITIONY:[["posy"]],

    DASHCOUNT:[["Dashes"]],
    SPEED:[["Speed", "Length"],[]],
};
generator.forBlock['ahs_get_player'] = function(block) {
    const args = propMap[block.getFieldValue('TYPE')];

    return [statement("getPlayer", false,
        args[0],
        args[1]||[]), Order.ATOMIC];
}
generator.forBlock['ahs_kill_player'] = function(block) {
    const angle_dir = block.getFieldValue('DIR');

    return statement("killPlayer", true,
        [],
        [generator.valueToCode(block, 'KILL', Order.NONE)||0, ...(block.getFieldValue('CUSTOMDIR')==="TRUE"?
            [Math.round(Math.cos(angle_dir)*10), Math.round(Math.sin(angle_dir)*10)] : [])]);
}
}