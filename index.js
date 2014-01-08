module.exports = function(coffeeBreak) {
	"use strict";

	coffeeBreak.registerTask('codecoverage', function(conf, logger, done) {
		console.log('Run code coverage', conf);

		done();
	});
};