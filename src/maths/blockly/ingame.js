import { Blocks, Events, FieldDropdown, FieldNumber, FieldTextInput } from "blockly";
import {simpleBlock, register} from "./utils.js";

export const gameColor = 350;

export function addIngameBlocks(){
    const toReturn = [];

    register("ahs_time_since_trans", toReturn, simpleBlock(function(){
        this.appendDummyInput('').appendField('time since last room transition');
        this.setInputsInline(true)
        this.setOutput(true, null);
        this.setTooltip('');
        this.setHelpUrl('');
        this.setOutput(true, 'Number');
        this.setColour(gameColor);
    }));
    register("ahs_has_berry", toReturn, simpleBlock(function(){
        this.appendDummyInput('ROOM').appendField('has berry from room').appendField(new FieldTextInput('room'), 'ROOM');
        this.appendValueInput('VALUE').appendField('with ID');
        this.setInputsInline(true)
        this.setOutput(true, null);
        this.setTooltip('Checks if the player has collected some berry');
        this.setHelpUrl('');
        this.setOutput(true, 'Number');
        this.setColour(gameColor);
    }));
    register("ahs_get_coremode", toReturn, simpleBlock(function(){
        this.appendDummyInput('').appendField('coremode');
        this.setInputsInline(true)
        this.setOutput(true, null);
        this.setTooltip('');
        this.setHelpUrl('');
        this.setOutput(true, 'Number');
        this.setColour(gameColor);
    }));

    return toReturn;
}
