'use strict';

var environment = require('./lib/environment'),
    atomPerforce = require('./lib/atom-perforce');

function setupEnvironment() {
    return environment.loadVarsFromEnvironment([
        'PATH',
        'P4CONFIG',
        'P4DIFF',
        'P4IGNORE',
        'P4MERGE',
        'P4PORT',
        'P4USER',
        'PAGER',
        'PATH'
    ]).catch(function(err) {
        console.error('could not load environment variables:', err);
        // try simply making sure /usr/local/bin (the default p4 location) is in the path
        // TODO: fallback for windows?
        if(process.env.PATH.split(':').indexOf('/usr/local/bin') === -1) {
            process.env.PATH = process.env.PATH + ':/usr/local/bin';
        }
    });
}

function setupObservers() {
    return atom.workspace.observeTextEditors(function(editor) {
        // mark changes on save
        editor.buffer.onDidSave(function(file) {
            atomPerforce.getChanges()
            .then(function(changes) {
                atomPerforce.showDiffMarks(file.path, changes);
            });
        });

        // mark changes on initial load
        if(editor.getPath()) {
            atomPerforce.getChanges(editor)
            .then(function(changes) {
                atomPerforce.showDiffMarks(editor.getPath(), changes);
            });
        }

        atomPerforce.showClientName();
    });
}

function setupCommands() {
    atom.commands.add('atom-workspace', 'perforce:edit', atomPerforce.edit);
    atom.commands.add('atom-workspace', 'perforce:add', atomPerforce.add);
    atom.commands.add('atom-workspace', 'perforce:sync', atomPerforce.sync);
    atom.commands.add('atom-workspace', 'perforce:revert', atomPerforce.revert);
}

module.exports = {
    activate: function activate(/*state*/) {
        setupEnvironment()
        .then(setupObservers)
        .then(setupCommands);
    }
};
