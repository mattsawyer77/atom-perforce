'use strict';

var childProcess = require('child_process'),
    Q = require('q'),
    shellValue = process.env.SHELL,
    envCommands;

function getSourceShellEnvCommand(filename) {
    return shellValue + " -c 'source " + filename + " >/dev/null && env'";
}

// TODO: remove this hack put in place until https://github.com/atom/atom/issues/6956 is resolved
if(/zsh$/.test(shellValue)) {
    envCommands = ['~/.zshenv', '~/.zshrc'].map(getSourceShellEnvCommand);
}
else if(/bash$/.test(shellValue)) {
    envCommands = ['~/.profile', '~/.bash_profile', '~/.bashrc'].map(getSourceShellEnvCommand);
}
else {
    envCommands = [shellValue + ' -lc env'];
}

module.exports = {
    /**
     * attempts to extract the requested variable values from the user's normal shell environment
     * @param  {array} requestedVars an array of strings, each one an environment variable name
     * @return {object} a promise for an object which is the extracted environment in the form of key/value pairs
     */
    extractVarsFromEnvironment: function extractVarsFromEnvironment(requestedVars) {
        function parseEnvOutput(output, extracted) {
            function splitIntoLines(blob) {
                return blob.trim().split('\n');
            }

            function parseLine(extracted, definition) {
                var match = (/(\w+)=(.*)/).exec(definition),
                    key, value;

                if(match) {
                    key = match[1];
                    value = match[2];
                    if(requestedVars.indexOf(key) !== -1) {
                        if(extracted.hasOwnProperty(key) && extracted[key] !== value) {
                            console.warn('conflicting env var definitions in source files for ' + key + '!');
                        }
                        extracted[key] = value;
                    }
                }
                return extracted;
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
                return Q.nfcall(childProcess.exec, command, { shell: shellValue })
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
