'use strict';

var childProcess = require('child_process'),
    Q = require('q'),
    shellValue = process.env.SHELL,
    envCommand;

// TODO: remove this hack put in place until https://github.com/atom/atom/issues/6956 is resolved
if(/zsh$/.test(shellValue)) {
    envCommand = shellValue + " -c 'source ~/.zshrc && env'";
}
else if(/bash$/.test(shellValue)) {
    envCommand = shellValue + " -c 'source ~/.bashrc && env'";
}
else {
    envCommand = shellValue + ' -lc export';
}

module.exports = {
    loadVarsFromEnvironment: function loadVarsFromEnvironment(vars) {
        var deferred = Q.defer();

        // run the command and update the local process environment:
        console.debug('atom-perforce: loading environment vars via command "' + envCommand + '"');
        childProcess.exec(envCommand, function(error, stdout) {
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
