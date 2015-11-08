'use strict';

var settings = require('./settings/settings'),
    atomPerforce = require('./lib/atom-perforce'),
    CompositeDisposable = require('atom').CompositeDisposable,
    commandsSetup = false,
    reactivateCommands = ['autoAdd', 'autoEdit', 'autoRevert'],
    observers;

// TODO: if Atom ever publishes an event for monitoring DOM changes, use that instead
// OR refactor this into its own service
function setupObservers() {
    var mutationObserverOptions = {
            subtree: true,
            childList: true,
            attributes: false
        },
        leftPanelObserver,
        treeObserver,
        destroyWatch;

    function getToolPanel() {
        return document.querySelector('.tool-panel');
    }

    function watchToolPanel() {
        // monitor the tree for changes (collapsing/expanding)
        treeObserver.observe(getToolPanel(), mutationObserverOptions);

        // make this work like an Atom observer
        treeObserver.dispose = treeObserver.disconnect;
    }

    // cleanup any observers before (re)observing
    deactivate();
    observers = new CompositeDisposable();

    treeObserver = new MutationObserver(function treeChanged(mutations/*, observer*/) {
        // we only care if some nodes were added, not removed
        if(mutations.some(function(mutation) {
            return mutation.addedNodes && mutation.addedNodes.length > 0;
        })) {
            atomPerforce.markOpenFiles();
        }
    });

    observers.add(treeObserver);

    // wait for the tool-panel to exist
    if(getToolPanel()) {
        watchToolPanel();
    }
    else {
        // setup observer for the left panel
        leftPanelObserver = new MutationObserver(function leftPanelChanged(/*mutations, observer*/) {
            if(getToolPanel()) {
                // stop waiting for the left panel to exist
                leftPanelObserver.disconnect();
                // watch for mutations within the panel
                watchToolPanel();
            }
        });

        leftPanelObserver.observe(document.querySelector('atom-panel-container.left'), mutationObserverOptions);
    }

    observers.add(atom.workspace.observeTextEditors(function(editor) {
        // mark changes on save
        var saveObserver = editor.buffer.onDidSave(function(file) {
            if(atom.config.get('atom-perforce').autoAdd) {
                atomPerforce.fileIsTracked(editor.getPath())
                .then(function(fileinfo) {
                    if(fileinfo === false) {
                        atomPerforce.add(file.path)
                        .then(function() {
                            return atomPerforce.markOpenFiles();
                        });
                    }
                });
            }
            atomPerforce.getChanges()
            .then(function(changes) {
                 atomPerforce.showDiffMarks(file.path, changes);
            });
        });

        observers.add(editor.onDidDestroy(function() {
            saveObserver.dispose();
        }));

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
                            atomPerforce.edit(editor.getPath(), false)
                            .then(function() {
                                atomPerforce.markOpenFiles();
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
                atomPerforce.fileIsTracked(editor.getPath())
                .then(function(fileinfo) {
                    if(fileinfo && fileinfo.action === 'edit') {
                        atomPerforce.getChanges(editor)
                        .then(function(changes) {
                            if(!(changes && changes.length)) {
                                // revert the file without confirmation
                                atomPerforce.revert(editor.getPath(), false)
                                .then(function() {
                                    atomPerforce.markOpenFiles();
                                });
                            }
                        });
                    }
                });
            }
        });

        observers.add(destroyWatch);
    }));

    observers.add(atom.workspace.observeActivePaneItem(function() {
        atomPerforce.showClientName();
    }));

    observers.add(atom.config.onDidChange('atom-perforce.defaultP4Location', atomPerforce.setupEnvironment));
    reactivateCommands.forEach(function(command) {
        observers.add(atom.config.onDidChange('atom-perforce.' + command, reactivate));
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
        .finally(atomPerforce.showDiffMarks);
    };
}

function revertReset() {
    deactivate();
    return atomPerforce.revert().finally(function() {
            return setupObservers();
        });
}

function setupCommands() {
    if(!commandsSetup) {
        ['perforce', 'p4'].forEach(function(prefix) {
            atom.commands.add('atom-workspace', prefix + ':edit', stateChangeWrapper(atomPerforce.edit));
            atom.commands.add('atom-workspace', prefix + ':add', stateChangeWrapper(atomPerforce.add));
            atom.commands.add('atom-workspace', prefix + ':sync', stateChangeWrapper(atomPerforce.sync));
            atom.commands.add('atom-workspace', prefix + ':revert', stateChangeWrapper(revertReset));
            atom.commands.add('atom-workspace', prefix + ':load-opened-files', stateChangeWrapper(atomPerforce.loadAllOpenFiles));
        });
        commandsSetup = true;
    }
}

function activate(/*state*/) {
    observers = setupObservers();
    return setupCommands();
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
