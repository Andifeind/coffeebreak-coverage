module.exports = function(coffeeBreak) {
	"use strict";

	var fs = require('fs'),
		path = require('path');

	var istanbul = require('istanbul'),
		mkdirp = require('mkdirp');

	coffeeBreak.registerTask('codecoverage', function(conf, logger, done) {
		console.log('Run code coverage', conf);

		var files = conf.files,
			tmpDir = path.join(__dirname, 'instrumented', conf.project);

		console.log('Code coverage out dir:', tmpDir);

		files.map(function(file) {
			console.log('File:', file);
			var source = fs.readFileSync(conf.cwd + '/' + file, 'utf8');
			var instrumenter = new istanbul.Instrumenter(),
				instrumented = instrumenter.instrumentSync(source, file);

			mkdirp.sync(path.dirname(tmpDir + '/' + file));
			fs.writeFileSync(tmpDir + '/' + file, instrumented);

			console.log('Write instrumented file:', tmpDir + '/' + file);
		});

		conf.cwdInstrumented = tmpDir;

		console.log('Conf after instrumentation', conf);

		done();
	});
};