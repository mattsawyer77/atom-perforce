'use strict';

var childProcess = require('child_process'),
    os = require('os'),
    Q = require('q'),
    shell = process.env.SHELL,
    envCommands;

function getSourceShellEnvCommand(filename) {
    return shell + " -c 'source " + filename + " >/dev/null && env'";
}

// this doesn't really work in windows, but probably isn't necessary anyway
if(os.platform() !== 'win32') {
    // TODO: remove this hack put in place until https://github.com/atom/atom/issues/6956 is resolved
    // NOTE: if a variable exists in multiple files in the array, the last one wins
    if(/zsh$/.test(shell)) {
        envCommands = ['~/.zshenv', '~/.zshrc'].map(getSourceShellEnvCommand);
    }
    else if(/bash$/.test(shell)) {
        envCommands = ['~/.profile', '~/.bash_profile', '~/.bashrc'].map(getSourceShellEnvCommand);
    }
    else {
        envCommands = [shell + ' -lc env'];
    }
}

module.exports = {
    /**
     * attempts to extract the requested variable values from the user's normal shell environment
     * @param  {array} requestedVars an array of strings, each one an environment variable name
     * @return {object} a promise for an object which is the extracted environment in the form of
     * key/value pairs
     */
    extractVarsFromEnvironment: function extractVarsFromEnvironment(requestedVars) {
        function parseEnvOutput(output, extracted) {
            function splitIntoLines(blob) {
                return blob.trim().split('\n');
            }

            function parseLine(_extracted, definition) {
                var match = (/(\w+)=(.*)/).exec(definition),
                    key, value;

                if(match) {
                    key = match[1];
                    value = match[2];
                    if(requestedVars.indexOf(key) !== -1) {
                        if(_extracted.hasOwnProperty(key) && _extracted[key] !== value) {
                            console.warn('conflicting env var definitions in source files for ' + key + ', overwriting previous ' + key + ' with ' + value);
                        }
                        _extracted[key] = value;
                    }
                }
                return _extracted;
            }

            // 1st element of exec output array is stdout
            if(Array.isArray(output)) {
                output = output[0];
            }

            return splitIntoLines(output).reduce(parseLine, extracted || {});
        } // parseEnvOutput

        // run the command(s) and extract the requested environment variables
        // use reduce to chain promises so that commands are executed sequentially
        return envCommands.reduce(function(result, command) {
            console.debug('atom-perforce: loading environment vars via command "' + command + '"');
            return result.then(function(extractedEnv) {
                return Q.nfcall(childProcess.exec, command, { shell: shell })
                .then(function(stdout) {
                    // parse the next command's output, merging with previous commands extracted env
                    return parseEnvOutput(stdout, extractedEnv);
                })
                .catch(function(err) {
                    console.warn('error executing command ' + command + ': ' + err);
                    return extractedEnv; // return what's already extracted anyway
                });
            });
        }, Q(false));
    }
};
