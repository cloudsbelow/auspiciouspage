import {simpleBlock, register, statement, generator} from "../blockly/utils.js";
import {Order} from "../blockly/codegen.js"

const color = 0;
const label="Madeline Crystal Helper"

const content = [];
register("MCrysHelper_getCrystal", content, simpleBlock(function(){
    this.appendDummyInput('NAME')
        .appendField('is player in Theo Crystal');
    this.setInputsInline(true)
    this.setOutput(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(color);
}));
register("MCrysHelper_setCrystal", content, simpleBlock(function(){
    this.appendValueInput('INCRYSTAL')
        .appendField('set player in Theo Crystal');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(color);
}));
const generators={
    MCrysHelper_getCrystal:function(block) {
        return [statement("MCrysHelper_getCrystal", false, [], []), Order.ATOMIC];
    },
    MCrysHelper_setCrystal:function(block) {
        return statement("MCrysHelper_setCrystal", true,
            [],
            [generator.valueToCode(block, 'INCRYSTAL', Order.NONE)||0]);
    },
};

export {//must be named these!!
    content,
    generators,
    color,
    label,
}
