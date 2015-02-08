'use strict';

var path = require('path'),
    p4 = require('node-perforce'),
    Q = require('q');

module.exports = {
    /**
     * p4 edit a file
     */
    edit: function edit() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath = path.dirname(editor.buffer.file.path),
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', ''),
            originalCWD = process.cwd(),
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
                // TODO: show something in the status bar temporarily
                console.log(openedBufferFilename + ' opened for edit', result);
            })
            .catch(function(err) {
                // TODO: show something in the status bar temporarily
                console.log('could not p4 edit file ' + openedBufferFilename, err);
            });
        })
        .then(function() {
            // reload the file, since perforce has likely chmod'd the file to be writable
            return editor.buffer.reload();
        })
        .catch(function(err) {
            console.err(err);
        });
    }
};
