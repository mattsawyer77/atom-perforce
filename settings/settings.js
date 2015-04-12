'use strict';

var defaultUnixP4Directory = '/usr/local/bin',
    defaultWindowsP4Directory = 'C:\Program Files\Perforce';

function getDefaultP4Location() {
    if(process.platform === 'win32') {
        return defaultWindowsP4Directory;
    }
    else {
        return defaultUnixP4Directory;
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
