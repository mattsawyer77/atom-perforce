var isInClient = require('../lib/is-in-client.js');

describe('isInClient', function () {
    it('should handle clientRoot with slashes and currentDirectory with backslashes', function () {
        var p4Info = {
            currentDirectory: 'C:\\source\\projectA\\lib\\moduleA',
            clientRoot: 'C:/SoUrCe'
        };

        expect(isInClient(p4Info)).toEqual(true);
    });

    it('should handle when client is unknown.', function () {
        var p4Info = {
            ['clientUnknown.']: true
        };

        expect(isInClient(p4Info)).toEqual(false);
    });

    it('shoule handle normal cases', function () {
        expect(isInClient({
            currentDirectory: 'C:\\source\\projecta\\lib\\modulea',
            clientRoot: 'C:\\source'
        })).toEqual(true);

        expect(isInClient({
            currentDirectory: '/source/projecta/lib/modulea',
            clientRoot: '/source/projecta'
        })).toEqual(true);
    });
});
