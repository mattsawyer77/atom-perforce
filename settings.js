module.exports = {
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
