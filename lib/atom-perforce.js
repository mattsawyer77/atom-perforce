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
            originalCWD = process.cwd(),
            pathChanged = false,
            openedBufferFilePath,
            openedBufferFilename;

        if(editor.buffer.file && editor.buffer.file.path) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', '');
            originalCWD = process.cwd();
            pathChanged = false;

            Q.fcall(function() {
                if(openedBufferFilePath !== originalCWD) {
                    // cd to the directory containing the opened file
                    process.chdir(openedBufferFilePath);
                    pathChanged = true;
                }
                else {
                    return false;
                }
            })
            // call p4 info to make sure perforce is available
            .then(Q.nfcall(p4.info))
            .then(function(p4Info) {
                console.log(p4Info);

                // open the file for edit
                return Q.nfcall(p4.edit, { files: [openedBufferFilename] })
                .then(function(result) {
                    setStatusInfo(result, 'info', 5000);
                    console.log(openedBufferFilename + ' opened for edit', result);
                })
                .catch(function(err) {
                    setStatusInfo('could not edit file ' + openedBufferFilename, 'error', 10000);
                    console.log('could not edit file ' + openedBufferFilename, err);
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

    add: function add() {
        var editor = atom.workspace.getActivePaneItem(),
            originalCWD = process.cwd(),
            pathChanged = false,
            openedBufferFilePath,
            openedBufferFilename;

        if(editor.buffer.file && editor.buffer.file.path) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', '');
            originalCWD = process.cwd();
            pathChanged = false;

            Q.fcall(function() {
                if(openedBufferFilePath !== originalCWD) {
                    // cd to the directory containing the opened file
                    process.chdir(openedBufferFilePath);
                    pathChanged = true;
                }
                else {
                    return false;
                }
            })
            // call p4 info to make sure perforce is available
            .then(Q.nfcall(p4.info))
            .then(function() {
                // open the file for add
                return Q.nfcall(p4.add, { files: [openedBufferFilename] })
                .then(function(result) {
                    setStatusInfo(result, 'info', 5000);
                    console.log(openedBufferFilename + ' opened for add', result);
                })
                .catch(function(err) {
                    setStatusInfo('could not add file ' + openedBufferFilename, 'info', 5000);
                    console.log('could not add file ' + openedBufferFilename, err);
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
    }
};
