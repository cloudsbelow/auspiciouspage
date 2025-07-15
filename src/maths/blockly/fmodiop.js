import { FieldTextInput } from "blockly";
import { generator, register, simpleBlock, statement,quoted, regSimple } from "./utils";




export const fmodColor = 310;

export function registerFmodBlocks(){
  const res = [];
  regSimple("aha_Play",res,function(){
    this.appendDummyInput('').appendField('Play event').appendField(new FieldTextInput('event:/'),'EV').appendField('at marked entity').appendField(new FieldTextInput('this'),'ENT');
    this.setInputsInline(true)
    this.setTooltip('Play an event and return a handle to it');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },function(block){
    var strs = [quoted(block.getFieldValue('EV'))]
    var ent = block.getFieldValue('ENT')
    if(ent!='this') strs.push(ent)
    return statement("fmodP",true,strs,[])
  })
  regSimple("aha_PlayInline",res,function(){
    this.appendDummyInput('').appendField('Play event').appendField(new FieldTextInput('event:/'),'EV').appendField('at marked entity').appendField(new FieldTextInput('this'),'ENT');
    this.setInputsInline(true)
    this.setTooltip('Play an event and return a handle to it');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(fmodColor);
  },function(block){
    var strs = [quoted(block.getFieldValue('EV'))]
    var ent = block.getFieldValue('ENT')
    if(ent!='this') strs.push(ent)
    return [statement("fmodP",false,strs,[]),0]
  })
  regSimple("aha_SetParam",res,function(){
    this.appendDummyInput('').appendField('Set param').appendField(new FieldTextInput('param'),'PARAM')
    this.appendValueInput('EV').appendField('of')
    this.appendValueInput('VALUE').appendField('to')
    this.setInputsInline(true)
    this.setTooltip('Set parameter of this audio event to specified integer');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>statement("fmodPS",true,
    [quoted(b.getFieldValue('PARAM'))],
    [generator.valueToCode(b,"EV",999),generator.valueToCode(b,"VALUE",999)]))
  regSimple("aha_GetParam",res,function(){
    this.appendDummyInput('').appendField('Get param').appendField(new FieldTextInput('param'),'PARAM')
    this.appendValueInput('EV').appendField('of event')
    this.setInputsInline(true)
    this.setTooltip('Get a parameter from an event (the raw value that gets set)');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(fmodColor);
  },(b)=>[statement("fmodPG",false,
    [quoted(b.getFieldValue('PARAM'))],[generator.valueToCode(b,"EV",999)]),0])
  regSimple("aha_GetParamFinal",res,function(){
    this.appendDummyInput('').appendField('Get param (final)').appendField(new FieldTextInput('param'),'PARAM')
    this.appendValueInput('EV').appendField('of event')
    this.setInputsInline(true)
    this.setTooltip('Get a final parameter from an event (after all modifiers)');
    this.setHelpUrl('');
    this.setOutput(true, 'Number');
    this.setColour(fmodColor);
  },(b)=>[statement("fmodPF",false,
    [quoted(b.getFieldValue('PARAM'))],[generator.valueToCode(b,"EV",999)]),0])
  regSimple("aha_Stop",res,function(){
    this.appendValueInput('EV').appendField('Stop event')
    this.setInputsInline(true)
    this.setTooltip('Stop an audio event');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>statement("fmodS",true,[],[generator.valueToCode(b,"EV",999)]))
  regSimple("aha_Trust",res,function(){
    this.appendValueInput('EV').appendField('Trust event')
    this.setInputsInline(true)
    this.setTooltip('Stops this event from being automatically stopped on death/transition. Returns whether the event existed.');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>statement("fmodC",true,[],[generator.valueToCode(b,"EV",999)]))
  regSimple("aha_SetVolume",res,function(){
    this.appendValueInput('EV').appendField('Set volume of')
    this.appendValueInput('VALUE').appendField('to')
    this.setInputsInline(true)
    this.setTooltip('Set the volume position of the audio event to given value in percent');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>statement("fmodV",true,
    [],
    [generator.valueToCode(b,"EV",999),generator.valueToCode(b,"VALUE",999)]))
  regSimple("aha_SetTimeline",res,function(){
    this.appendValueInput('EV').appendField('Set timeline position of')
    this.appendValueInput('VALUE').appendField('to')
    this.setInputsInline(true)
    this.setTooltip('Set the timeline position of the audio event to given value in miliseconds');
    this.setHelpUrl('');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(fmodColor);
  },(b)=>statement("fmodT",true,
    [],
    [generator.valueToCode(b,"EV",999),generator.valueToCode(b,"VALUE",999)]))
  return res
}
