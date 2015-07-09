'use strict';

var childProcess = require('child_process'),
    Q = require('q'),

    // this command should generate a list of all exports from a login shell:
    exportsCommand = process.env.SHELL + " -lc export";

module.exports = {
    loadVarsFromEnvironment: function loadVarsFromEnvironment(vars) {
        var deferred = Q.defer();

        // run the command and update the local process environment:
        childProcess.exec(exportsCommand, function(error, stdout) {
            stdout.trim().split('\n').forEach(function(definition) {
                var match = (/(\w+)=(.*)/).exec(definition),
                    key, value;

                if(match) {
                    key = match[1];
                    value = match[2];
                    if(vars.indexOf(key) !== -1) {
                        process.env[key] = value;
                    }
                }
            });

            deferred.resolve();
        });

        return deferred.promise;
    }
};
