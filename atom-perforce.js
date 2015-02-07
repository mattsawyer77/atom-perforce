'use strict';

var path = require('path'),
    p4 = require('node-perforce'),
    Q = require('q'),
    environment = require('./lib/environment');

module.exports = {
    activate: function activate(/*state*/) {
        // atom.workspace.observeTextEditors(function(editor) {
        //     editor.buffer.onWillSave(function(file) {
        //     });
        // });

        environment.loadVarsFromEnvironment([
            'PATH',
            'P4CONFIG',
            'P4DIFF',
            'P4IGNORE',
            'P4MERGE',
            'P4PORT',
            'P4USER',
            'PAGER',
            'PATH',
        ])
        .then(function() {
            console.log('loaded environment variables');
        })
        .catch(function(err) {
            console.error('could not load environment variables:', err);
        });

        atom.commands.add('atom-workspace', 'perforce:edit', function() {
            var editor = atom.workspace.getActivePaneItem(),
                openedBufferFilePath = path.dirname(editor.buffer.file.path),
                openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + '/', ''),
                originalCWD = process.cwd(),
                pathChanged = false;

            // cd to the directory containing the opened file
            Q.fcall(function() {
                if(openedBufferFilePath !== originalCWD) {
                    pathChanged = true;
                    return Q.nfcall(process.chdir, openedBufferFilePath);
                }
                return true;
            })
            // call p4 info
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
        });


    }
};
