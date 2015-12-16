require('chai').should();

var fs = require('fs');
var path = require('path');

var settings = require('../settings/settings.js');

describe('settings', function() {
	it('should have the right default perfroce path in different environments', function() {
		var p4FullPath = path.join(settings.defaultP4Location.default, (process.platform.indexOf('win32') >= 0) ? 'p4.exe' : 'p4');
		fs.statSync(p4FullPath);
	});
});