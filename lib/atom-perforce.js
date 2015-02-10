'use strict';

var path = require('path'),
    p4 = require('node-perforce'),
    Q = require('q'),
    $ = require('jquery'),
    statusTileElements = {
        info: $('<span/>').addClass('perforce perforce-info'),
        error: $('<span/>').addClass('perforce perforce-error'),
        warning: $('<span/>').addClass('perforce perforce-warning')
    },
    tile;

function setStatusInfo(message, messageType, timeout) {
    var statusBar = document.querySelector('status-bar'),
        statusTileElement;

    if(statusBar && statusBar.addLeftTile) {
        statusTileElement = statusTileElements[messageType]
        .clone()
        .append('Perforce: ' + message);

        if(tile && tile.destroy) {
            tile.destroy();
        }

        tile = statusBar.addLeftTile({
            item: statusTileElement,
            priority: 100
        });

        if(timeout) {
            setTimeout(function() {
                if(tile && tile.destroy) {
                    tile.destroy();
                }
            }, timeout);
        }
    }
    else {
        console.warn('status bar is not present');
    }
}

module.exports = {
    /**
     * p4 edit a file
     */
    edit: function edit() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor.buffer.file && editor.buffer.file.path) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', '');

            // call p4 info to make sure perforce is available
            Q.nfcall(p4.info, { cwd: openedBufferFilePath })
            .then(function(p4Info) {
                console.log(p4Info);

                // open the file for edit
                return Q.nfcall(p4.edit, { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                .then(function(result) {
                    setStatusInfo(result, 'info', 5000);
                    console.log(result, result);
                })
                .catch(function(err) {
                    setStatusInfo(err, 'error', 10000);
                    console.error(err);
                });
            })
            .then(function() {
                // reload the file, since perforce has likely chmod'd the file to be writable
                return editor.buffer.reload();
            })
            .catch(function(err) {
                setStatusInfo(err, 'error', 10000);
                console.err(err);
            });
        }
        else {
            console.warn('cannot edit an unsaved file');
            setStatusInfo('cannot edit an unsaved file', 'warning', 10000);
        }
    },

    /**
     * execute p4 add to add the currently opened file in perforce
     */
    add: function add() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor.buffer.file && editor.buffer.file.path) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', '');

            // call p4 info to make sure perforce is available
            Q.nfcall(p4.info, { cwd: openedBufferFilePath })
            .then(function() {
                // open the file for add
                return Q.nfcall(p4.add, { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                .then(function(result) {
                    setStatusInfo(result, 'info', 5000);
                    console.log(result);
                })
                .catch(function(err) {
                    setStatusInfo(err, 'info', 5000);
                    console.error(err);
                });
            })
            .catch(function(err) {
                console.err(err);
            });
        }
        else {
            setStatusInfo('cannot add an unsaved file', 'warning', 10000);
            console.warn('cannot add an unsaved file');
        }
    },

    /**
     * execute p4 sync
     */
    sync: function sync() {
        var execCWD = process.cwd();
        if(atom.project && atom.project.rootDirectory.path) {
            execCWD = atom.project.rootDirectory.path;
        }

        // call p4 info to make sure perforce is available
        Q.nfcall(p4.info, { cwd: execCWD })
        .then(function() {
            return Q.nfcall(p4.sync, { cwd: execCWD });
        })
        .then(function(result) {
            setStatusInfo('p4 sync completed', 'info', 5000);
            console.log('p4 sync completed', result);
        })
        .catch(function(err) {
            // this message is returned on stderr, so node-perforce treats it as a failure
            if(err.message && err.message.indexOf('File(s) up-to-date.') !== -1) {
                setStatusInfo('p4 sync completed', 'info', 5000);
                console.log('p4 sync completed', err);
            }
            else {
                setStatusInfo(err, 'info', 10000);
                console.error('could not p4 sync', err);
            }
        });
    },


    /**
     * execute p4 revert
     */
    revert: function revert() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor.buffer.file && editor.buffer.file.path) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', '');

            atom.confirm({
                message: 'Revert?',
                detailedMessage: 'Are you sure you want to revert your changes to ' + openedBufferFilename + '?',
                buttons: {
                    Revert: function revertButton() {
                        // call p4 info to make sure perforce is available
                        Q.nfcall(p4.info, { cwd: openedBufferFilePath })
                        .then(function() {
                            return Q.nfcall(p4.revert, {
                                cwd: openedBufferFilePath,
                                files: [openedBufferFilename]
                            });
                        })
                        .then(function(result) {
                            setStatusInfo(result, 'info', 5000);
                            console.log('p4 revert completed');
                        })
                        .catch(function(err) {
                            setStatusInfo(err, 'error', 10000);
                            console.error('could not p4 revert', err);
                        });
                    },
                    Cancel: function cancelButton() {
                        console.log('revert canceled');
                    }
                }
            });
        }
        else {
            setStatusInfo('no file is currently open');
        }
    }
};
