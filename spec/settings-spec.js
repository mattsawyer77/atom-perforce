var settings = require('../settings/settings.js');

describe('settings', function () {
    it('should have the right default perfroce path in different environments', function () {
        var expected = (process.platform.indexOf('win32') >= 0)?
            'C:\\Program Files\\Perforce' :
            '/usr/local/bin';
        expect(settings.defaultP4Location.default).toEqual(expected);
    });
});
