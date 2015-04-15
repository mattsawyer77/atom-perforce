'use strict';

var path = require('path'),
    environment = require('./lib/environment'),
    settings = require('./settings/settings'),
    atomPerforce = require('./lib/atom-perforce'),
    CompositeDisposable = require('atom').CompositeDisposable,
    commandsSetup = false,
    reactivateCommands = ['autoAdd', 'autoEdit', 'autoRevert'],
    observers;

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
    ])
    .catch(function(err) {
        console.error('could not load environment variables:', err);
    })
    .finally(function() {
        var pathElements,
            defaultPath = atom.config.get('atom-perforce.defaultP4Location');

        // make sure the default p4 location is in the path
        pathElements = process.env.PATH.split(path.delimiter);
        if(pathElements.indexOf(defaultPath) === -1) {
            pathElements.unshift(defaultPath);
            process.env.PATH = pathElements.join(path.delimiter);
        }
    });
}

function setupObservers() {
    var observer = new CompositeDisposable(),
        treeObserver = new MutationObserver(function treeChanged(/*mutations, observer*/) {
            atomPerforce.markOpenFiles();
        }),
        treeObserverOptions = {
            subtree: true,
            childList: true,
            attributes: false
        },
        destroyWatch;

    // monitor the tree for changes (collapsing/expanding)
    // TODO: if Atom ever publishes an event for this, use that instead
    treeObserver.observe(document.querySelector('.tool-panel'), treeObserverOptions);

    // make this work like an Atom observer
    treeObserver.dispose = treeObserver.disconnect;

    observer.add(atom.workspace.observeTextEditors(function(editor) {
        // mark changes on save
        var saveObserver = editor.buffer.onDidSave(function(file) {
            if(atom.config.get('atom-perforce').autoAdd) {
                atomPerforce.fileIsTracked(editor.getPath())
                .then(function(fileinfo) {
                    if(fileinfo === false) {
                        atomPerforce.add(file.path);
                    }
                });
            }
            atomPerforce.getChanges()
            .then(function(changes) {
                 atomPerforce.showDiffMarks(file.path, changes);
            });
        });

        editor.onDidDestroy(function() {
            saveObserver.dispose();
        });

        // mark changes on initial load
        if(editor.getPath()) {
            atomPerforce.getChanges(editor)
            .then(function(changes) {
                atomPerforce.showDiffMarks(editor.getPath(), changes);
            });

            if(atom.config.get('atom-perforce').autoEdit) {
                atomPerforce.fileIsTracked(editor.getPath())
                .then(function(fileinfo) {
                    var watchBufferChanges;
                    if(fileinfo && !fileinfo.action) {
                        watchBufferChanges = editor.buffer.onDidChange(function onDidChange() {
                            watchBufferChanges.dispose();
                            atomPerforce.edit(editor.getPath(), false);
                        });
                    }
                });
            }
        }

        // handle closing the buffer
        destroyWatch = editor.onDidDestroy(function editorDestroyed() {
            destroyWatch.dispose();
            if(atom.config.get('atom-perforce').autoRevert) {
                atomPerforce.fileIsTracked(editor.getPath())
                .then(function(fileinfo) {
                    if(fileinfo && fileinfo.action === 'edit') {
                        atomPerforce.getChanges(editor)
                        .then(function(changes) {
                            if(!(changes && changes.length)) {
                                // revert the file without confirmation
                                atomPerforce.revert(editor.getPath(), false);
                            }
                        });
                    }
                });
            }
        });
    }));

    observer.add(atom.workspace.observeActivePaneItem(function() {
        atomPerforce.showClientName();
    }));

    observer.add(atom.config.onDidChange('atom-perforce.defaultP4Location', setupEnvironment));
    reactivateCommands.forEach(function(command) {
        observer.add(atom.config.onDidChange('atom-perforce.' + command, reactivate));
    });

    atomPerforce.markOpenFiles();

    return observers;
}

function stateChangeWrapper(fn) {
    return function() {
        var args = [].slice.call(arguments);
        // execute a promise-returning function
        return fn.apply(this, args)
        // then unconditionally mark the open files
        .finally(atomPerforce.markOpenFiles);
    };
}

function setupCommands() {
    if(!commandsSetup) {
        ['perforce', 'p4'].forEach(function(prefix) {
            atom.commands.add('atom-workspace', prefix + ':edit', stateChangeWrapper(atomPerforce.edit));
            atom.commands.add('atom-workspace', prefix + ':add', stateChangeWrapper(atomPerforce.add));
            atom.commands.add('atom-workspace', prefix + ':sync', stateChangeWrapper(atomPerforce.sync));
            atom.commands.add('atom-workspace', prefix + ':revert', stateChangeWrapper(atomPerforce.revert));
            atom.commands.add('atom-workspace', prefix + ':load-opened-files', stateChangeWrapper(atomPerforce.loadAllOpenFiles));
        });
        commandsSetup = true;
    }
}

function activate(/*state*/) {
    return setupEnvironment()
    .then(function() {
        observers = setupObservers();
        return setupCommands();
    });
}

function deactivate() {
    if(observers && observers.dispose) {
        observers.dispose();
    }
}

function reactivate() {
    deactivate();
    return activate();
}

module.exports = {
    config: settings,
    activate: activate,
    deactivate: deactivate
};
