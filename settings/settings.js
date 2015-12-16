'use strict';

var execSync = require('child_process').execSync;
var path = require('path');

function getDefaultP4Location() {
    if(process.platform === 'win32') {
        var p4FullPath = execSync('where p4', { encoding: 'utf8'});
        return p4FullPath.slice(0, p4FullPath.indexOf('p4.exe') - 1);
    }
    else {
        return '/usr/local/bin';
    }
}

module.exports = {
    defaultP4Location: {
        type: 'string',
        default: getDefaultP4Location()
    },
    autoAdd: {
        title: 'Auto-Add',
        description: 'automatically p4 add unknown files after saving',
        type: 'boolean',
        default: false
    },
    autoEdit: {
        title: 'Auto-Edit',
        description: 'automatically p4 edit unopened files after modifying',
        type: 'boolean',
        default: false
    },
    autoRevert: {
        title: 'Auto-Revert',
        description: 'automatically p4 revert an opened, but unchanged file when closing',
        type: 'boolean',
        default: false
    }
};
