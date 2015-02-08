'use strict';

var environment = require('./lib/environment'),
    atomPerforce = require('./lib/atom-perforce');

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
            // try simply making sure /usr/local/bin (the default p4 location) is in the path
            // TODO: fallback for windows?
            if(process.env.PATH.split(':').indexOf('/usr/local/bin') === -1) {
                process.env.PATH = process.env.PATH + ':/usr/local/bin';
            }
        });

        atom.commands.add('atom-workspace', 'perforce:edit', atomPerforce.edit);
        atom.commands.add('atom-workspace', 'perforce:add', atomPerforce.add);
        // TODO: implement the following:
        // atom.commands.add('atom-workspace', 'perforce:sync', atomPerforce.sync);
        // atom.commands.add('atom-workspace', 'perforce:revert', atomPerforce.revert);
        // atom.commands.add('atom-workspace', 'perforce:diff', atomPerforce.diff);
    }
};
