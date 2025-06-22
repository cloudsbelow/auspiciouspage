import { FieldTextInput } from "blockly";
import { generator, register, simpleBlock, statement } from "./utils";




export const fmodColor = 310;

export function registerFmodBlocks(){
  const res = [];
  const reg = (name,fn, cg)=>{
    register(name,res, simpleBlock(fn));
    generator.forBlock[name] = cg
  }
  reg("aha_Play",function(){
    this.appendDummyInput('').appendField('Play event').appendField(new FieldTextInput('event:/'),'EV').appendField('at marked entity').appendField(new FieldTextInput('this'),'ENT');
    this.setInputsInline(true)
    this.setTooltip('Play an event and return a handle to it');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },function(block){
    var strs = [block.getFieldValue('EV')]
    var ent = block.getFieldValue('ENT')
    if(ent!='this') strs.push(ent)
    return [statement("fmodPlay",true,strs,[]),0]
  })
  reg("aha_PlayInline",function(){
    this.appendDummyInput('').appendField('Play event').appendField(new FieldTextInput('event:/'),'EV').appendField('at marked entity').appendField(new FieldTextInput('this'),'ENT');
    this.setInputsInline(true)
    this.setTooltip('Play an event and return a handle to it');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(fmodColor);
  },function(block){
    var strs = [block.getFieldValue('EV')]
    var ent = block.getFieldValue('ENT')
    if(ent!='this') strs.push(ent)
    return [statement("fmodPlay",false,strs,[]),0]
  })
  reg("aha_SetParam",function(){
    this.appendDummyInput('').appendField('Set param').appendField(new FieldTextInput('param'),'PARAM')
    this.appendValueInput('EV').appendField('of')
    this.appendValueInput('VALUE').appendField('to')
    this.setInputsInline(true)
    this.setTooltip('Set parameter of this audio event to specified integer');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>[statement("fmodParamS",true,
    [b.getFieldValue('PARAM')],
    [generator.valueToCode(b,"EV"),generator.valueToCode(b,"VALUE",999)]),0])
  reg("aha_GetParam",function(){
    this.appendDummyInput('').appendField('Get param').appendField(new FieldTextInput('param'),'PARAM')
    this.appendValueInput('EV').appendField('of event')
    this.setInputsInline(true)
    this.setTooltip('Get a parameter from an event (the raw value that gets set)');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(fmodColor);
  },(b)=>[statement("fmodParamG",false,
    [b.getFieldValue('PARAM')],[generator.valueToCode(b,"EV")]),0])
  reg("aha_GetParamFinal",function(){
    this.appendDummyInput('').appendField('Get param (final)').appendField(new FieldTextInput('param'),'PARAM')
    this.appendValueInput('EV').appendField('of event')
    this.setInputsInline(true)
    this.setTooltip('Get a final parameter from an event (after all modifiers)');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(fmodColor);
  },(b)=>[statement("fmodParamF",false,
    [b.getFieldValue('PARAM')],[generator.valueToCode(b,"EV")]),0])
  reg("aha_Stop",function(){
    this.appendValueInput('EV').appendField('Stop event')
    this.setInputsInline(true)
    this.setTooltip('Stop an audio event');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>[statement("fmodStop",true,[],[generator.valueToCode(b,"EV")]),0])
  reg("aha_Trust",function(){
    this.appendValueInput('EV').appendField('Trust event')
    this.setInputsInline(true)
    this.setTooltip('Stops this event from being automatically stopped on death/transition. Returns whether the event existed.');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>[statement("fmodTrust",true,[],[generator.valueToCode(b,"EV")]),0])
  return res
}