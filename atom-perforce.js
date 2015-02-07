'use strict';

var p4 = require('node-perforce');

module.exports = {
    activate: function activate(/*state*/) {
        atom.workspace.observeTextEditors(function(editor) {
            editor.buffer.onWillSave(function() {
                p4.info(function(err, p4Info) {
                    if(err) {
                        console.error(err);
                    }
                    else {
                        console.log(p4Info);
                    }
                });
            });
        });
    }
};
