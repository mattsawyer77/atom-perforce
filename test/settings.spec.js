require('chai').should();

var settings = require('../settings/settings.js');

describe('settings', function () {
    it('should have the right default perfroce path in different environments', function () {
        if (process.platform.indexOf('win32') >= 0) {
            settings.defaultP4Location.default.should.equal('C:\\Program Files\\Perforce');
        }
        else {
            settings.defaultP4Location.default.should.equal('/usr/local/bin');
        }
    });
});
