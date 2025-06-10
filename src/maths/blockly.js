//-- blocks
const operators = {
    ADD:["+"],

}

Blockly.common.defineBlocks({
    channel_identifier: {
        init: function() {
            this.appendDummyInput('NAME').appendField('@').appendField(new Blockly.FieldTextInput('channel'), 'CHANNEL');
            this.setOutput(true, null);
            this.setTooltip('Channel');
            this.setHelpUrl('');
            this.setColour(0);
            this.setOutput(true, 'Identifier');
        }
    },
    variable_identifier: {
        init: function() {
            this.appendDummyInput('NAME').appendField('$').appendField(new Blockly.FieldVariable('variable'), 'VARIABLE');
            this.setOutput(true, null);
            this.setTooltip('Variable');
            this.setHelpUrl('');
            this.setColour(100);
            this.setOutput(true, 'Identifier');
        }
    },
    number: {
        init: function() {
            this.appendDummyInput('').appendField(new Blockly.FieldNumber(0, -Infinity, Infinity, 1), 'NUMBER');
            this.setOutput(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
            this.setOutput(true, 'Number');
        }
    },
    time_since_trans: {
        init: function() {
            this.appendDummyInput('').appendField('time since room transitioned');
            this.setInputsInline(true)
            this.setOutput(true, 'Number');
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    op: {
        init: function() {
            this.appendValueInput('OP1');
            console.log(Object.entries(operators).map(([k,v])=>[v[0],k]))
            this.appendValueInput('OP2').appendField(new Blockly.FieldDropdown(
                Object.entries(operators).map(([k,v])=>[v[0],k])), 'OPERATOR');
            this.setInputsInline(true)
            this.setOutput(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    not: {
        init: function() {
            this.appendValueInput('VALUE').appendField('not');
            this.setInputsInline(true)
            this.setOutput(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    set: {
        init: function() {
            this.appendValueInput('TO_SET').appendField('set').setCheck('Identifier');
            this.appendValueInput('VALUE').appendField('to');
            this.setInputsInline(true)
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip('Channel');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    print: {
        init: function() {
            this.appendDummyInput('TEXT').appendField('print').appendField(new Blockly.FieldTextInput('label'), 'TEXT');
            this.appendValueInput('VALUE0');
            this.appendValueInput('VALUE1');
            this.appendValueInput('VALUE2');//todo: make this a mutator
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    has_berry: {
        init: function() {
            this.appendDummyInput('ROOM').appendField('has berry from room').appendField(new Blockly.FieldTextInput('room'), 'ROOM');
            this.appendValueInput('VALUE').appendField('with ID');
            this.setInputsInline(true)
            this.setOutput(true, null);
            this.setTooltip('Checks if the player has collected some berry');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    set_flag: {
        init: function() {
            this.appendDummyInput('FLAG').appendField('set flag').appendField(new Blockly.FieldTextInput('flag'), 'FLAG');
            this.appendValueInput('VALUE').appendField('to');
            this.setInputsInline(true)
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    get_flag: {
        init: function() {
            this.appendDummyInput('FLAG').appendField('flag').appendField(new Blockly.FieldTextInput('flag'), 'FLAG');
            this.setInputsInline(true)
            this.setOutput(true, null);
            this.setTooltip('Checks if some flag is true');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    set_counter: {
        init: function() {
            this.appendDummyInput('COUNTER').appendField('set counter').appendField(new Blockly.FieldTextInput('counter'), 'COUNTER');
            this.appendValueInput('VALUE').appendField('to');
            this.setInputsInline(true)
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    get_counter: {
        init: function() {
            this.appendDummyInput('COUNTER').appendField('counter').appendField(new Blockly.FieldTextInput('counter'), 'COUNTER');
            this.setInputsInline(true)
            this.setOutput(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    set_coremode: {
        init: function() {
            this.appendValueInput('VALUE').appendField('set coremode to');
            this.setInputsInline(true)
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    get_coremode: {
        init: function() {
            this.appendDummyInput('COREMODE').appendField('coremode');
            this.setInputsInline(true)
            this.setOutput(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
    get_player: {
        init: function() {
            this.appendDummyInput('TEXT').appendField('get player property')
                .appendField(new Blockly.FieldDropdown([
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
            this.setColour(225);
        }
    },
    kill_player: {
        init: function() {
            this.appendDummyInput('').appendField('kill player');
            this.appendDummyInput('').appendField('custom direction?').appendField(new Blockly.FieldCheckbox('TRUE'), 'CUSTOMDIR').appendField(new FieldAngle(0), 'DIR');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setTooltip('');
            this.setHelpUrl('');
            this.setColour(225);
        }
    },
});

const Order = {
    ATOMIC: 0,
};
const generator = new Blockly.Generator('AuspiciousScript');
function statement(name, nextLine, stringList, intList){
    return `${name}${stringList.length>0?`<${stringList}>`:""}(${intList})${!nextLine?"":";"}`
}

generator.forBlock['channel_identifier'] = function (block) {
    return [`@${block.getFieldValue('CHANNEL')}`, Order.NONE];
}
generator.forBlock['variable_identifier'] = function(block) {
    return [`$${generator.getVariableName(block.getFieldValue('VARIABLE'))}`, Order.NONE];
}
generator.forBlock['number'] = function() {
    return [block.getFieldValue('NUMBER'), Order.NONE];
}
generator.forBlock['time_since_trans'] = function() {
    return [statement("timeSinceTrans",false,[],[]), Order.NONE];
}
generator.forBlock['op'] = function() {
    const op=operators[block.getFieldValue('OPERATOR')];
    return [`(${generator.valueToCode(block, 'OP1', Order.ATOMIC)} ${op[1]||op[0]} ${generator.valueToCode(block, 'OP2', Order.ATOMIC)})`, Order.NONE];
}
generator.forBlock['not'] = function() {
    return [`!(${generator.valueToCode(block, 'VALUE', Order.ATOMIC)})`, Order.NONE];
}

generator.forBlock['set'] = function(block) {
    return `${generator.valueToCode(block, 'TO_SET', Order.ATOMIC)} = ${
        generator.valueToCode(block, 'VALUE', Order.ATOMIC)}`;
}
generator.forBlock['print'] = function(block, generator) {
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
generator.forBlock['has_berry'] = function(block) {
    return [statement("hasBerry", false,
        [generator.valueToCode(block, 'ROOM', Order.ATOMIC)],
        [generator.valueToCode(block, 'VALUE', Order.ATOMIC)]), Order.NONE];
}
generator.forBlock['get_flag'] = function(block) {
    return [statement("getFlag", false,
        [block.getFieldValue('FLAG')],
        []), Order.ATOMIC];
}
generator.forBlock['set_flag'] = function(block) {
    return statement("setFlag", true,
        [block.getFieldValue('FLAG')],
        [generator.valueToCode(block, 'VALUE', Order.ATOMIC)]);
}
generator.forBlock['get_counter'] = function(block) {
    return [statement("getCounter", false,
        [block.getFieldValue('COUNTER')],
        []), Order.ATOMIC];
}
generator.forBlock['set_counter'] = function(block) {
    return statement("setCounter", true,
        [block.getFieldValue('COUNTER')],
        [generator.valueToCode(block, 'VALUE', Order.ATOMIC)]);
}
generator.forBlock['get_coremode'] = function(block) {
    return [statement("getCoreMode", false,
        [],
        []), Order.ATOMIC];
}
generator.forBlock['set_counter'] = function(block) {
    return statement("setCoreMode", true,
        [],
        [generator.valueToCode(block, 'VALUE', Order.ATOMIC)]);
}
const propMap = {
    SPEEDX:[["speedx"]],
    SPEEDY:[["speedy"]],
    POSITIONX:[["posx"]],
    POSITIONY:[["posy"]],

    DASHCOUNT:[["Dashes"]],
    SPEED:[["Speed", "Length"],[]],
};
generator.forBlock['get_player'] = function() {
    const args = propMap[block.getFieldValue('TYPE')];

    return [statement("getPlayer", false,
        args[0],
        args[1]||[]), Order.NONE];
}
generator.forBlock['kill_player'] = function() {
    const angle_dir = block.getFieldValue('DIR');

    return statement("killPlayer", true,
        [],
        block.getFieldValue('CUSTOMDIR')?
            [Math.cos(angle_dir), Math.sin(angle_dir)] : []);
}

document.getElementById("compileButton").addEventListener("click", ()=>
    document.getElementById("compilerin").value =generator.workspaceToCode(Blockly.getMainWorkspace()));

//--
const toolbox = {
    'kind': 'flyoutToolbox',
    'contents': [
        {
            'kind': 'block',
            'type': 'channel_identifier'
        },
        {
            'kind': 'block',
            'type': 'variable_identifier'
        },
        {
            'kind': 'block',
            'type': 'number'
        },
        {
            'kind': 'block',
            'type': 'op'
        },
        {
            'kind': 'block',
            'type': 'not'
        },
        {
            'kind': 'block',
            'type': 'time_since_trans'
        },
        {
            'kind': 'block',
            'type': 'has_berry'
        },
        {
            'kind': 'block',
            'type': 'get_flag'
        },
        {
            'kind': 'block',
            'type': 'get_counter'
        },
        {
            'kind': 'block',
            'type': 'get_coremode'
        },
        {
            'kind': 'block',
            'type': 'get_player'
        },
        {
            'kind': 'block',
            'type': 'set'
        },
        {
            'kind': 'block',
            'type': 'print'
        },
        {
            'kind': 'block',
            'type': 'set_flag'
        },
        {
            'kind': 'block',
            'type': 'set_counter'
        },
        {
            'kind': 'block',
            'type': 'set_coremode'
        },
        {
            'kind': 'block',
            'type': 'kill_player'
        },
    ]
};
const workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolbox,
    scrollbars: true,
    horizontalLayout: false,
    toolboxPosition: "end",
});

Blockly.Events.disable();
Blockly.serialization.workspaces.load({}, workspace, false);
Blockly.Events.enable();

generator.init(workspace);
generator.nameDB_ = new Blockly.Names();
generator.nameDB_.setVariableMap(workspace.getVariableMap());
