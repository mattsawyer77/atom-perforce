'use strict';

var atomPerforce = module, // sugary alias
    path = require('path'),
    p4 = require('node-perforce'),
    Q = require('q'),
    $ = require('jquery'),
    environment = require('./environment'),
    clientStatusBarElement = $('<div/>')
        .addClass('git-branch inline-block')
        .append('<span class="icon icon-git-branch"></span>')
        .append('<span class="branch-label"></span>'),
    changeHunkDescriptorRegex = /^[\d,]+(\w)(\d+)(,)?(\d+)?$/,
    envVarsToExtract = [
        'P4CONFIG',
        'P4IGNORE',
        'P4PORT',
        'P4USER',
        'P4TICKETS',
        'P4PASSWD',
        'HOME'
    ],
    clientStatusBarTile,
    environmentReady;

function execP4Command(command, options) {
    var p4Fn = p4[command];
    if(p4Fn && p4Fn.call) {
        return Q.when(environmentReady || atomPerforce.exports.setupEnvironment())
        .then(function(p4Env) {
            var defaultOptions = { env: p4Env };

            return Q.nfcall(p4Fn, $.extend(true, {}, defaultOptions, options));
        });
    }
    else {
        throw new Error('unknown node-perforce method: ' + command);
    }
}

function setStatusClient(p4ClientName) {
    var statusBar = document.querySelector('status-bar'),
        statusElement;

    if(clientStatusBarTile && clientStatusBarTile.destroy) {
        clientStatusBarTile.destroy();
    }

    if(p4ClientName) {
        statusElement = clientStatusBarElement.clone();
        statusElement.find('.branch-label').text(p4ClientName);

        clientStatusBarTile = statusBar.addRightTile({
            item: statusElement,
            priority: 0
        });
    }
}

/**
 * build a list of change hunks, where each hunk is a descriptor, a list of additions, and a list of deletions
 * @param {string} p4DiffOutput the output of a p4 diff command
 * @return {array} list of hunk objects
 */
function processDiff(p4DiffOutput) {
    var changes = [],
        change, firstChar;

    p4DiffOutput.split('\n').forEach(function(line) {
        if(line.length > 1) {
            firstChar = line.substr(0, 1);
            if(!isNaN(parseInt(firstChar, 10))) {
                if(change) {
                    changes.push(change);
                }

                change = {
                    descriptor: line,
                    added: [],
                    removed: []
                };
            }
            else if(firstChar === '<') {
                change.removed.push(line);
            }
            else if(firstChar === '>') {
                change.added.push(line);
            }
        }
    });

    if(change) {
        changes.push(change);
    }

    return changes;
}

/**
 * transform p4 depot format output to a local file path given the client root path
 * @param {string} clientPath the client path (i.e. starting with //<client name>/...)
 * @param {object} p4Info the result of p4.info
 */
function transformClientPathToLocalPath(clientPath, p4Info) {
    var clientPathRegex = new RegExp('^//' + p4Info.clientName + '/(.+)$'),
        match = clientPathRegex.exec(clientPath);

    if(match) {
        return p4Info.clientRoot + path.sep + match[1];
    }
    else {
        throw new Error('could not parse client path ', clientPath);
    }
}

atomPerforce.exports = {
    /**
     * setup the perforce environment by using environment.js
     * to extract environment variables and optionally overriding the PATH
     * if the user has specified a custom p4 executable path.
     * this is called lazily when the 1st perforce command is attempted,
     * or when the default p4 executable setting is altered
     * @return {object} promise for when the environment is setup
     */
    setupEnvironment: function setupEnvironment() {
        var pathElements,
            defaultPath = atom.config.get('atom-perforce.defaultP4Location');

        environmentReady = environment.extractVarsFromEnvironment(envVarsToExtract);

        // make sure the default p4 location is in the path
        pathElements = process.env.PATH.split(path.delimiter);
        if(pathElements.indexOf(defaultPath) === -1) {
            pathElements.unshift(defaultPath);
            process.env.PATH = pathElements.join(path.delimiter);
        }
        return environmentReady;
    },

    /**
     * p4 edit a file
     * @return {object} promise for completion of p4 edit
     */
    edit: function edit() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.getPath());
            openedBufferFilename = path.basename(editor.getPath());

            // call p4 info to make sure perforce is available
            return execP4Command('info', { cwd: openedBufferFilePath })
            .then(function(p4Info) {
                if(!p4Info['clientUnknown.'] && p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                    return execP4Command('edit', { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                    .then(function(result) {
                        // p4 edit returns a 0 exit code even if the file is already opened
                        if((/currently opened/).test(result)) {
                            atom.notifications.addWarning('Perforce: file already opened', { detail: result, dismissable: true });
                        }
                        else {
                            atom.notifications.addSuccess('Perforce: file opened for edit', { detail: result });
                        }
                    })
                    .catch(function(err) {
                        atom.notifications.addError('Perforce: failed to open for edit', { detail: err.message, dismissable: true });
                        console.error(err);
                        return false;
                    });
                }
                else {
                    console.info(openedBufferFilePath + ' is outside any known perforce workspace');
                }
            })
            .catch(function(err) {
                console.err(err);
                return false;
            });
        }
        else {
            atom.notifications.addWarning('Perforce: cannot edit an unsaved file', { dismissable: true });
            console.warn('cannot edit an unsaved file');
            return Q.when(false);
        }
    },

    /**
     * execute p4 add to add the currently opened file in perforce
     * @return {object} promise for completion of p4 add
     */
    add: function add() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.getPath());
            openedBufferFilename = path.basename(editor.getPath());

            // call p4 info to make sure perforce is available
            return execP4Command('info', { cwd: openedBufferFilePath })
            .then(function(p4Info) {
                if(!p4Info['clientUnknown.'] && p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                    return execP4Command('add', { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                    .then(function(result) {
                        // for some unfortunate reason, p4 add <existing file> returns a 0 exit code
                        if((/can't add existing file/).test(result)) {
                            atom.notifications.addWarning('Perforce: file already exists', { detail: result, dismissable: true });
                        }
                        else if((/already opened|currently opened/).test(result)) {
                            atom.notifications.addWarning('Perforce: file already opened', { detail: result, dismissable: true });
                        }
                        else {
                            atom.notifications.addSuccess('Perforce: file opened for add', { detail: result });
                            console.log(result);
                        }
                    })
                    .catch(function(err) {
                        atom.notifications.addError('Perforce: failed to open for add', { detail: err.message, dismissable: true });
                            console.error(err);
                            return false;
                        });
                }
                else {
                    console.info(openedBufferFilePath + ' is outside any known perforce workspace');
                }
            })
            .catch(function(err) {
                console.err(err);
                return false;
            });
        }
        else {
            atom.notifications.addWarning('Perforce: cannot add an unsaved file', { dismissable: true });
            console.warn('cannot add an unsaved file');
            return Q.when(false);
        }
    },

    /**
     * execute p4 sync
     */
    sync: function sync() {
        var promises = [],
            directories = [],
            successDirectories = [];

        function checkResolved(dir) {
            function handleResolveResult(result) {
                var fileList;
                if(!(/No file\(s\) to resolve/i).test(result)) {
                    // parse the filename from each line
                    fileList = result.trim().split('\n').map(function(line) {
                        var match = (/^(.*) - (.*)$/).exec(line);

                        if(match) {
                            return match[1];
                        }
                        else {
                            return false;
                        }
                    })
                    // filter out blanks
                    .filter(function(line) {
                        return !!line;
                    })
                    // translate to relative path
                    .map(function(filename) {
                        return path.relative(dir, filename);
                    });

                    if(fileList.length > 1) {
                        atom.notifications.addWarning('Perforce: some file(s) need to be resolved in ' + dir, {
                            detail: fileList.join('\n'),
                            dismissable: true
                        });
                    }
                    else {
                        atom.notifications.addWarning('Perforce: ' + fileList[0] + ' needs to be resolved in ' + dir, {
                            dismissable: true
                        });
                    }
                }
            }

            // do p4 resolve -n to check if files need to be resolved post-sync
            return execP4Command('resolve', { cwd: dir, files: ['-n ./...'] })
            .then(handleResolveResult)
            .catch(function(err) {
                handleResolveResult(err.message);
            });
        }

        directories = atom.project.getDirectories().map(function(projectRoot) {
            return projectRoot.realPath;
        });

        if(directories && directories.length) {
            directories.forEach(function(dir) {
                var syncDeferred = Q.defer(),
                    synced = syncDeferred.promise;

                promises.push(synced);
                // call p4 info to make sure perforce is available
                execP4Command('info', { cwd: dir })
                .then(function(p4Info) {
                    if (!p4Info['clientUnknown.'] && p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                        return execP4Command('sync', { cwd: dir, files: ['./...'] });
                    }
                })
                .then(function() {
                    successDirectories.push(dir);
                    return checkResolved(dir)
                    .then(function() {
                        syncDeferred.resolve();
                    });
                })
                .catch(function(err) {
                    // this message is returned on stderr, so node-perforce treats it as a failure
                    if(err.message && (/file\(s\) up-to-date/i).test(err.message)) {
                        console.log('p4 sync completed in ' + dir);
                        successDirectories.push(dir);
                        return checkResolved(dir)
                        .then(function() {
                            syncDeferred.resolve();
                        });
                    }
                    else {
                        atom.notifications.addError('Perforce: sync failed', { detail: err.message, dismissable: true });
                        console.error('could not p4 sync', err);
                        syncDeferred.reject(err.message);
                    }
                });
            }); // per directory

            return Q.all(promises)
                .finally(function() {
                    if(successDirectories.length) {
                        atom.notifications.addSuccess('Perforce: sync complete', {
                            detail: "paths synced:\n" + successDirectories.join('\n')
                        });
                    }
                });
        } // if there were directories
    },

    /**
     * execute p4 revert
     * @param {string=} filepath optional filepath or event object
     * @param {boolean=} confirm (default true) whether to confirm before reverting
     * @return {object} a promise for when the operation is complete
     */
    revert: function revert(filename, confirm) {
        var deferred = Q.defer(),
            editor = atom.workspace.getActivePaneItem(),
            filepath;

        confirm = confirm !== false; // default to true
        filename = filename ? filename : editor.getPath();
        filepath = path.dirname(filename);

        function executeRevert() {
            // call p4 info to make sure perforce is available
            return execP4Command('info', { cwd: filepath })
            .then(function(p4Info) {
                if (!p4Info['clientUnknown.'] && p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                    return execP4Command('revert', {
                        cwd: filepath,
                        files: [path.basename(filename)]
                    });
                }
            })
            .then(function(result) {
                if(editor && editor.buffer) {
                    editor.buffer.reload();
                }
                atom.notifications.addSuccess('Perforce: file reverted', { detail: result });
                console.log('p4 revert completed');
                deferred.resolve(true);
            })
            .catch(function(err) {
                atom.notifications.addError('Perforce: revert failed', { detail: err.message, dismissable: true});
                console.error('could not p4 revert', err);
                deferred.reject(err);
            });
        }

        function executeCancel() {
            console.log('revert canceled');
            deferred.resolve(false);
        }

        if(confirm) {
            atom.confirm({
                message: 'Revert?',
                detailedMessage: 'Are you sure you want to revert your changes to ' + path.basename(filename) + '?',
                buttons: {
                    Revert: executeRevert,
                    Cancel: executeCancel
                }
            });
        }
        else {
            executeRevert()
            .then(function() {
                deferred.resolve(true);
            })
            .catch(function(err) {
                deferred.reject(err);
            });
        }

        return deferred.promise;
    },

    /**
     * get a list of changes to the current file compared to the depot version
     * @param {object=} an editor instance
     * @return {object} a promise for an array of hunks, where each hunk is an object containing:
     * - {string} descriptor: a descriptor denoting the range of lines affected and which type of operation
     * - {array} added: a list of lines added
     * - {array} removed: a list of lines removed
     */
    getChanges: function getChanges(editor) {
        var deferred = Q.defer(),
            openedBufferFilePath,
            openedBufferFilename;

        editor = editor || atom.workspace.getActivePaneItem();

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.getPath());
            openedBufferFilename = path.basename(editor.getPath());

            // call p4 info to make sure perforce is available
            execP4Command('info', { cwd: openedBufferFilePath })
            .then(function(p4Info) {
                if (!p4Info['clientUnknown.'] && p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                                    // call p4 diff on the file
                    return execP4Command('diff', {
                        cwd: openedBufferFilePath,
                        files: [openedBufferFilename]
                    })
                    .then(function(result) {
                        console.log(result);
                        deferred.resolve(processDiff(result));
                    })
                    .catch(function(err) {
                        if(!/not opened on this client/.test(err)) {
                            console.error(err);
                            deferred.reject(err);
                        }
                        else {
                            deferred.resolve([]);
                        }
                    });
                }
            })
            .catch(function(err) {
                console.error(err);
                deferred.reject(err);
            });
        }
        else {
            deferred.reject('no file currently open');
        }

        return deferred.promise;
    },

    /**
     * show diff marks in the file (regardless of which pane(s) it's open in)
     * @param {string} filepath the full path of the file
     * @param {array} changes  a list of change hunks produced by processDiff()
     */
    showDiffMarks: function showDiffMarks(filepath, changes) {
        atom.workspace.getPaneItems().forEach(function(editor) {
            if(editor && editor.getPath && editor.getPath() === filepath) {
                // clear any pre-existing perforce markers
                editor.getDecorations({perforce: true}).forEach(function(decoration) {
                    var marker = decoration.getMarker();
                    if(marker && marker.destroy) {
                        marker.destroy();
                    }
                });

                // mark each change in the list
                changes.forEach(function(change) {
                    var startLine, endLine, changeType, descriptor, marker;

                    descriptor = changeHunkDescriptorRegex.exec(change.descriptor);
                    if(descriptor) {
                        switch(descriptor[1]) {
                            case 'c': changeType = 'modified'; break;
                            case 'd': changeType = 'removed'; break;
                            case 'a': changeType = 'added'; break;
                            default: throw new Error('unrecognized change hunk type ' + descriptor[1]);
                        }
                        startLine = parseInt(descriptor[2], 10);
                        if(descriptor[4] && descriptor[3] === ',') {
                            endLine = parseInt(descriptor[4], 10);
                        }
                        else {
                            endLine = startLine;
                        }
                        marker = editor.markBufferRange([[startLine - 1, 0], [endLine, 0]]);
                        editor.decorateMarker(marker, {
                            type: 'line-number',
                            class: 'git-line-' + changeType,
                            perforce: true
                        });
                    }
                });
            }
        });
    },

    /**
     * show the p4 client (a.k.a. workspace) name in the right side of the status bar
     */
    showClientName: function showClientName() {
        var editor = atom.workspace.getActiveTextEditor(),
            dir;

        if(editor) {
            dir = path.dirname(editor.getPath());
        }
        else if(atom.project.getDirectories() && atom.project.getDirectories().length) {
            dir = atom.project.getDirectories()[0].realPath;
        }

        if(dir) {
            // call p4 info to make sure perforce is available
            execP4Command('info', { cwd: dir })
            .then(function(p4Info) {
                if(p4Info['clientUnknown.'] || !p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                    setStatusClient(false);
                }
                else {
                    setStatusClient(p4Info.clientName);
                }
            })
            .catch(function(err) {
                if((/command not found/).test(err)) {
                    atom.notifications.addError('Perforce: p4 command not found on path', {
                        detail: [
                            'Your path does not contain the p4 command. You can either specify the ',
                            'p4 command\'s directory in the atom-perforce settings, or set your PATH ',
                            'environment variable to include the directory that contains the p4 command.'
                        ].join(''),
                        dismissable: true
                    });
                }
                console.error(err);
                setStatusClient(false);
            });
        }
        else {
            setStatusClient(false);
        }
    },

    /**
     * get a list of files that are currently opened in this workspace
     * @return {array} a promise for a array of p4 fstat objects from node-perforce's opened()
     */
    getOpenedFiles: function getOpenedFiles() {
        var projectRoots = atom.project.getDirectories(),
            promises = [],
            p4Info;

        if(projectRoots && projectRoots.length) {
            projectRoots.forEach(function(projectRoot) {
                var deferred = Q.defer();
                promises.push(deferred.promise);

                // call p4 info to make sure perforce is available
                Q.when(p4Info || execP4Command('info', { cwd: projectRoot.path }))
                .then(function(p4InfoResult) {
                    p4Info = p4InfoResult;
                    return execP4Command('opened', { files: ['./...'], cwd: projectRoot.path });
                })
                .then(function(p4Opened) {
                    deferred.resolve(p4Opened
                        .filter(function(fileinfo) {
                            return fileinfo && fileinfo.clientFile;
                        })
                        .map(function(fileinfo) {
                            fileinfo.localPath = transformClientPathToLocalPath(fileinfo.clientFile, p4Info);
                            return fileinfo;
                        })
                    );
                })
                .catch(function(err) {
                    console.error(err);
                    deferred.reject(err);
                });
            });

            return Q.allSettled(promises)
                // combine the results for each root directory
                .then(function(results) {
                    return results.reduce(function(memo, result) {
                        if(result.state === 'fulfilled') {
                            memo = [].concat(memo, result.value);
                        }
                        return memo;
                    }, []);
                });
        }
        else {
            return Q.when([]);
        }
    },

    /**
     * load all files currently opened for add/edit into buffers
     */
    loadAllOpenFiles: function loadAllOpenFiles() {
        return atomPerforce.exports.getOpenedFiles()
        .then(function(p4OpenedFiles) {
            var editors = atom.workspace.getTextEditors();

            p4OpenedFiles.filter(function(fileinfo) {
                return fileinfo.type !== 'binary' && !(/delete/).test(fileinfo.action);
            })
            .forEach(function(fileinfo) {
                // is the file already opened in a buffer?
                if(!editors.some(function(editor) {
                    return fileinfo.localPath === editor.getPath();
                })) {
                    atom.workspace.open(fileinfo.localPath, {
                        activatePane: false
                    });
                }
            });
        })
        .catch(function(err) {
            atom.notifications.addError('Perforce: failed to load all currently opened files', { detail : err, dismissable: true});
        });
    },

    /**
     * mark files that are opened for edit or add in the tree
     * TODO: get away from this jQueryish non-API code if possible
     * @param {array=} openedFiles optional array of p4-opened (fstat format) objects
     * (see getOpenedFiles return value)
     */
    markOpenFiles: function markOpenFiles(openedFiles) {
        Q.when(openedFiles || atomPerforce.exports.getOpenedFiles())
        .then(function(p4OpenedFiles) {
            // clear all markers first
            var elements = document.querySelectorAll('.perforce.status-modified, .perforce.status-added');
            [].forEach.call(elements, function(element) {
                ['perforce', 'status-modified', 'status-added'].forEach(function(className) {
                    element.classList.remove(className);
                });
            });

            // add back markers
            p4OpenedFiles.forEach(function(fileinfo) {
                elements = document.querySelectorAll('[data-path="' + fileinfo.localPath + '"]');
                [].forEach.call(elements, function(element) {
                    var className;
                    switch(fileinfo.action) {
                        case 'edit':
                        case 'move/add':
                        case 'branch':
                        case 'integrate':
                            className = 'status-modified'; break;
                        case 'add':
                        case 'import':
                            className = 'status-added'; break;
                        case 'delete':
                        case 'move/delete':
                        case 'purge':
                        case 'archive':
                            className = 'status-removed'; break;
                    }
                    if(className) {
                        element.classList.add('perforce');
                        element.classList.add(className);
                    }
                });
            });
        })
        .catch(function(err) {
            atom.notifications.addError('Perforce: failed to indicate currently opened files', { detail: err.message, dismissable: true });
        });
    },

    /**
     * check whether a file is tracked (i.e. has been added to) perforce
     * @param {string} filepath the full file path
     * @param {object} a promise for either:
     * boolean: false if the file is not tracked in perforce, OR
     * object: the fstat object from p4 fstat
     * NOTE: the promise will be rejected if the file is not inside a perforce workspace
     */
    fileIsTracked: function fileIsTracked(filepath) {
        var deferred = Q.defer();
        var dir = path.dirname(filepath);

        execP4Command('info', { cwd: dir })
        .then(function(p4Info) {
            if (!p4Info['clientUnknown.'] && p4Info.currentDirectory.startsWith(p4Info.clientRoot)) {
                return execP4Command('fstat', {
                    cwd: dir,
                    files: [path.basename(filepath)]
                })
                .then(function(fileinfo) {
                    if(fileinfo) {
                        deferred.resolve(fileinfo);
                    }
                    else {
                        deferred.resolve(false);
                    }
                });
            }
        })
        .catch(function(err) {
            console.log(err);
            if(/no such file/.test(err)) {
                // the file is within a p4 workspace, but is not added
                deferred.resolve(false);
            }
            else {
                // the file is outside a p4 workspace
                deferred.reject(err);
            }
        });

        return deferred.promise;
    }
};
