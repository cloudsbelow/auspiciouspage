import { FieldDropdown, FieldCheckbox, FieldTextInput, FieldNumber } from "blockly";
import {simpleBlock, register, regSimple, statement, generator} from "./utils.js";
//import {FieldAngle} from "@blockly/field-angle";

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
        this.setTooltip('0 is cold, 1 is hot');
        this.setHelpUrl('');
        this.setOutput(true, 'Number');
        this.setColour(gameColor);
    }));
    register("ahs_set_coremode", toReturn, simpleBlock(function() {
        this.appendValueInput('VALUE').appendField('set coremode to');
        this.setInputsInline(true)
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('');
        this.setHelpUrl('');
        this.setColour(gameColor);
    }));
    register("ahs_get_player", toReturn, simpleBlock(function(){//todo: mutator
        this.appendDummyInput('').appendField('get player property')
            .appendField(new FieldDropdown([
                ['x speed', 'SPEEDX'],
                ['y speed', 'SPEEDY'],
                ['x position', 'POSITIONX'],
                ['y position', 'POSITIONY'],
                ['number of dashes', 'DASHCOUNT'],
                ['speed', 'SPEED'],
            ]), 'TYPE');
        this.setOutput(true, null);
        this.setTooltip('');
        this.setHelpUrl('');
        this.setOutput(true, 'Number');
        this.setColour(gameColor);
    }));
    register("ahs_kill_player", toReturn, simpleBlock(function(){
        this.appendValueInput('KILL').appendField('kill player if')
        this.appendDummyInput('').appendField('custom direction?').appendField(new FieldCheckbox('TRUE'), 'CUSTOMDIR').appendField(new FieldNumber(90), 'DIR');
        this.setInputsInline(false)
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('');
        this.setHelpUrl('');
        this.setColour(gameColor);
    }));
    regSimple("ahs_trigt", toReturn, function(){
        this.appendValueInput("NODE").setCheck(null).appendField("Trigger trigger on node");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(gameColor);
        this.setTooltip("Call the OnEnter function of the smallest trigger overlapping this node (node 0 is entity itself)");
      },(b)=>statement("triggerTrigger",true,
        [],
        [generator.valueToCode(b,"NODE",999)]))

    return toReturn;
}
