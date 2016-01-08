'use strict';

module.exports = function isInClient(p4Info, path) {
    if (p4Info['clientUnknown.']) {
        return false;
    }

    path = (path || p4Info.currentDirectory).replace(/\\/g, '/').toLowerCase();
    var root = p4Info.clientRoot.replace(/\\/g, '/').toLowerCase();
    return path.startsWith(root);
};
