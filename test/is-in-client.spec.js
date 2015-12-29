require('chai').should();

var isInClient = require('../lib/is-in-client.js');

describe('isInClient', function () {
    it('should handle clientRoot with slashes and currentDirectory with backslashes', function () {
        var p4Info = {
            currentDirectory: 'C:\\source\\projectA\\lib\\moduleA',
            clientRoot: 'C:/SoUrCe'
        };

        isInClient(p4Info).should.be.true;
    });

    it('should handle when client is unknown.', function () {
        var p4Info = {
            ['clientUnknown.']: true
        };

        isInClient(p4Info).should.be.false;
    });

    it('shoule handle normal cases', function () {
        isInClient({
            currentDirectory: 'C:\\source\\projecta\\lib\\modulea',
            clientRoot: 'C:\\source'
        }).should.be.true;

        isInClient({
            currentDirectory: '/source/projecta/lib/modulea',
            clientRoot: '/source/projecta'
        }).should.be.true;
    });
});
