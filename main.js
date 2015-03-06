'use strict';

var Q = require('q'),
    environment = require('./lib/environment'),
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
        if(process.platform !== 'win32') {
            if(process.env.PATH.split(':').indexOf('/usr/local/bin') === -1) {
                process.env.PATH = process.env.PATH + ':/usr/local/bin';
            }
        }
    });
}

function setupObservers() {
    var treeObserver = new MutationObserver(function treeChanged(mutations, observer) {
            atomPerforce.markOpenFiles();
        }),
        options = {
            subtree: true,
            childList: true,
            attributes: false
        };

    // monitor the tree for changes (collapsing/expanding)
    // TODO: if Atom ever publishes an event for this, use that instead
    treeObserver.observe(document.querySelector('.tool-panel'), options);

    atom.workspace.observeTextEditors(function(editor) {
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

    atomPerforce.markOpenFiles();
}

function setupCommands() {
    ['perforce', 'p4'].forEach(function(prefix) {
        atom.commands.add('atom-workspace', prefix + ':edit', atomPerforce.edit);
        atom.commands.add('atom-workspace', prefix + ':add', atomPerforce.add);
        atom.commands.add('atom-workspace', prefix + ':sync', atomPerforce.sync);
        atom.commands.add('atom-workspace', prefix + ':revert', atomPerforce.revert);
        atom.commands.add('atom-workspace', prefix + ':load-opened-files', atomPerforce.loadAllOpenFiles);
    });
}

module.exports = {
    activate: function activate(/*state*/) {
        setupEnvironment()
        .then(setupObservers)
        .then(setupCommands);
    }
};
