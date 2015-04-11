'use strict';

var path = require('path'),
    environment = require('./lib/environment'),
    settings = require('./settings'),
    atomPerforce = require('./lib/atom-perforce'),
    CompositeDisposable = require('atom').CompositeDisposable,
    defaultUnixP4Directory = '/usr/local/bin',
    defaultWindowsP4Directory = 'C:\Program Files\Perforce',
    commandsSetup = false,
    observers;

function getDefaultP4Location() {
    if(process.platform === 'win32') {
        return defaultWindowsP4Directory;
    }
    else {
        return defaultUnixP4Directory;
    }
}

function stateChangeWrapper(fn) {
    return fn().then(resetP4OpenedCache);
}

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
            defaultPath = atom.config.get('atom-perforce.defaultP4Location') || getDefaultP4Location();

        // make sure the default p4 location is in the path
        pathElements = process.env.PATH.split(path.delimiter);
        if(pathElements.indexOf(defaultPath) === -1) {
            pathElements.unshift(defaultPath);
            process.env.PATH = pathElements.join(path.delimiter);
        }
    });
}

function setupObservers() {
    var observers = new CompositeDisposable(),
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

    observers.add(atom.workspace.observeTextEditors(function(editor) {
        // mark changes on save
        var saveObserver = editor.buffer.onDidSave(function(file) {
            if(atom.config.get('atom-perforce').autoAdd) {
                if(!atomPerforce.fileIsTracked(file.path)) {
                    atomPerforce.add(file.path);
                }
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
                .then(function(found) {
                    if(found) {
                        watchBufferChanges = editor.buffer.onDidChange(function onDidChange() {
                            watchBufferChanges.dispose();
                            atomPerforce.edit(editor.getPath(), false)
                            .then(function() {
                                resetP4OpenedCache();
                            });
                        });
                    }
                });
            }
        }

        // handle closing the buffer
        destroyWatch = editor.onDidDestroy(function editorDestroyed() {
            destroyWatch.dispose();
            if(atom.config.get('atom-perforce').autoRevert) {
                atomPerforce.getChanges(editor)
                .then(function(changes) {
                    if(!(changes && changes.length)) {
                        getFileFromOpenedCache(editor.getPath())
                        .then(function(isOpen) {
                            if(isOpen) {
                                // revert the file without confirmation
                                atomPerforce.revert(editor.getPath(), false);
                            }
                        });
                    }
                });
            }
        });

    observers.add(atom.workspace.observeActivePaneItem(function() {
        atomPerforce.showClientName();
    }));

    observers.add(atom.config.onDidChange('atom-perforce.defaultP4Location', setupEnvironment));

    atomPerforce.markOpenFiles();

    return observers;
}

function setupCommands() {
    if(!commandsSetup) {
        ['perforce', 'p4'].forEach(function(prefix) {
            atom.commands.add('atom-workspace', prefix + ':edit', atomPerforce.edit);
            atom.commands.add('atom-workspace', prefix + ':add', atomPerforce.add);
            atom.commands.add('atom-workspace', prefix + ':sync', atomPerforce.sync);
            atom.commands.add('atom-workspace', prefix + ':revert', atomPerforce.revert);
            atom.commands.add('atom-workspace', prefix + ':load-opened-files', atomPerforce.loadAllOpenFiles);
        });
        commandsSetup = true;
    }
}

module.exports = {
    config: settings,
        defaultP4Location: {
            type: 'string',
            default: getDefaultP4Location()
        }
    },
    activate: function activate(/*state*/) {
        setupEnvironment()
        .then(function() {
            observers = setupObservers();
            setupCommands();
        });
    },
    deactivate: function deactivate() {
        if(observers && observers.dispose) {
            observers.dispose();
        }
    }
};
