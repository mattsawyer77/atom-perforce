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
    clientStatusBarElement = $('<div/>')
        .addClass('git-branch inline-block')
        .append('<span class="icon icon-git-branch"></span>')
        .append('<span class="branch-label"></span>'),
    changeHunkDescriptorRegex = /^[\d,]+(\w)(\d+)(,)?(\d+)?$/,
    statusMessageTile,
    clientStatusBarTile;

function setStatusInfo(message, messageType, timeout) {
    var statusBar = document.querySelector('status-bar'),
        statusTileElement;

    if(statusBar && statusBar.addLeftTile) {
        statusTileElement = statusTileElements[messageType]
        .clone()
        .append('Perforce: ' + message);

        if(statusMessageTile && statusMessageTile.destroy) {
            statusMessageTile.destroy();
        }

        statusMessageTile = statusBar.addLeftTile({
            item: statusTileElement,
            priority: 100
        });

        if(timeout) {
            setTimeout(function() {
                if(statusMessageTile && statusMessageTile.destroy) {
                    statusMessageTile.destroy();
                }
            }, timeout);
        }
    }
    else {
        console.warn('status bar is not present');
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

module.exports = {
    /**
     * p4 edit a file
     */
    edit: function edit() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + path.sep, '');

            // call p4 info to make sure perforce is available
            Q.nfcall(p4.info, { cwd: openedBufferFilePath })
            .then(function(/*p4Info*/) {
                // open the file for edit
                return Q.nfcall(p4.edit, { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                .then(function(result) {
                    setStatusInfo(result, 'info', 5000);
                    console.log(result, result);
                    module.exports.markOpenFiles();
                })
                .catch(function(err) {
                    setStatusInfo(err, 'error', 10000);
                    console.error(err);
                });
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

    /**
     * execute p4 add to add the currently opened file in perforce
     */
    add: function add() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + path.sep, '');

            // call p4 info to make sure perforce is available
            Q.nfcall(p4.info, { cwd: openedBufferFilePath })
            .then(function() {
                // open the file for add
                return Q.nfcall(p4.add, { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                .then(function(result) {
                    setStatusInfo(result, 'info', 5000);
                    console.log(result);
                    module.exports.markOpenFiles();
                })
                .catch(function(err) {
                    setStatusInfo(err, 'error', 10000);
                    console.error(err);
                });
            })
            .catch(function(err) {
                setStatusInfo(err, 'error', 10000);
                console.err(err);
            });
        }
        else {
            setStatusInfo('cannot add an unsaved file', 'warning', 10000);
            console.warn('cannot add an unsaved file');
        }
    },

    /**
     * execute p4 sync
     */
    sync: function sync() {
        var execCWD = process.cwd(),
            editor = atom.workspace.getActivePaneItem();

        if(editor && editor.getPath()) {
            execCWD = path.dirname(editor.buffer.file.path);
        }

        // call p4 info to make sure perforce is available
        Q.nfcall(p4.info, { cwd: execCWD })
        .then(function() {
            return Q.nfcall(p4.sync, { cwd: execCWD });
        })
        .then(function(result) {
            setStatusInfo('p4 sync completed', 'info', 5000);
            console.log('p4 sync completed', result);
            module.exports.markOpenFiles();
        })
        .catch(function(err) {
            // this message is returned on stderr, so node-perforce treats it as a failure
            if(err.message && err.message.indexOf('File(s) up-to-date.') !== -1) {
                setStatusInfo('p4 sync completed', 'info', 5000);
                console.log('p4 sync completed', err);
            }
            else {
                setStatusInfo(err, 'info', 10000);
                console.error('could not p4 sync', err);
            }
        });
    },


    /**
     * execute p4 revert
     */
    revert: function revert() {
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath,
            openedBufferFilename;

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + path.sep, '');

            atom.confirm({
                message: 'Revert?',
                detailedMessage: 'Are you sure you want to revert your changes to ' + openedBufferFilename + '?',
                buttons: {
                    Revert: function revertButton() {
                        // call p4 info to make sure perforce is available
                        Q.nfcall(p4.info, { cwd: openedBufferFilePath })
                        .then(function() {
                            return Q.nfcall(p4.revert, {
                                cwd: openedBufferFilePath,
                                files: [openedBufferFilename]
                            });
                        })
                        .then(function(result) {
                            setStatusInfo(result, 'info', 5000);
                            console.log('p4 revert completed');
                            module.exports.markOpenFiles();
                        })
                        .catch(function(err) {
                            setStatusInfo(err, 'error', 10000);
                            console.error('could not p4 revert', err);
                        });
                    },
                    Cancel: function cancelButton() {
                        console.log('revert canceled');
                    }
                }
            });
        }
        else {
            setStatusInfo('no file is currently open');
        }
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
            openedBufferFilename,
            originalP4DIFF = process.env.P4DIFF;

        editor = editor || atom.workspace.getActivePaneItem();

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);
            openedBufferFilename = editor.buffer.file.path.replace(openedBufferFilePath + path.sep, '');

            // call p4 info to make sure perforce is available
            Q.nfcall(p4.info, { cwd: openedBufferFilePath })
            .then(function() {
                if(process.env.P4DIFF) {
                    // prevent any custom diff tools from overriding the default p4 diff command
                    delete process.env.P4DIFF;
                }
                // call p4 diff on the file
                return Q.nfcall(p4.diff, { cwd: openedBufferFilePath, files: [openedBufferFilename] })
                .then(function(result) {
                    console.log(result);
                    deferred.resolve(processDiff(result));
                })
                .catch(function(err) {
                    console.error(err);
                    deferred.reject(err);
                })
                .finally(function() {
                    process.env.P4DIFF = originalP4DIFF;
                });
            })
            .catch(function(err) {
                console.err(err);
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
                            type: 'gutter',
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
        var editor = atom.workspace.getActivePaneItem(),
            openedBufferFilePath;

        if(editor && editor.getPath && editor.getPath()) {
            openedBufferFilePath = path.dirname(editor.buffer.file.path);

            // call p4 info to make sure perforce is available
            Q.nfcall(p4.info, { cwd: openedBufferFilePath })
            .then(function(p4Info) {
                setStatusClient(p4Info.clientName);
            })
            .catch(function(err) {
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
     * @return {object} a promise for a hash of changelist # to array of filenames
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
                Q.when(p4Info || Q.nfcall(p4.info, { cwd: projectRoot.path }))
                .then(function(p4InfoResult) {
                    p4Info = p4InfoResult;
                    return Q.nfcall(p4.opened, { cwd: projectRoot.path });
                })
                .then(function(p4Opened) {
                    deferred.resolve(p4Opened.map(function(fileinfo) {
                        fileinfo.localPath = transformClientPathToLocalPath(fileinfo.clientFile, p4Info);
                        return fileinfo;
                    }));
                })
                .catch(function(err) {
                    console.error(err);
                    setStatusInfo(err, 10000);
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
        module.exports.getOpenedFiles()
        .then(function(p4OpenedFiles) {
            var editors = atom.workspace.getTextEditors();

            p4OpenedFiles.forEach(function(fileinfo) {
                if(fileinfo.type !== 'binary') {
                    // is the file already opened in a buffer?
                    if(!editors.some(function(editor) {
                        return fileinfo.localPath === editor.getPath();
                    })) {
                        atom.workspace.open(fileinfo.localPath, {
                            activatePane: false
                        });
                    }
                }
            });
        })
        .catch(function(err) {
            setStatusInfo(err, 10000);
        });
    },

    /**
     * mark files that are opened for edit or add in the tree
     * TODO: get away from this jQueryish non-API code if possible
     */
    markOpenFiles: function markOpenFiles() {
        module.exports.getOpenedFiles()
        .then(function(p4OpenedFiles) {
            // clear all markers first
            var elements = document.querySelectorAll('.perforce .status-modified, .perforce .status-added');
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
                        case 'edit': className = 'status-modified'; break;
                        case 'add':  className = 'status-added'; break;
                    }
                    if(className) {
                        element.classList.add('perforce');
                        element.classList.add(className);
                    }
                });
            });
        })
        .catch(function(err) {
            setStatusInfo(err, 10000);
        });
    }
};
