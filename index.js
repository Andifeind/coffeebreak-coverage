module.exports = function(coffeeBreak) {
	"use strict";

	var fs = require('fs'),
		path = require('path');

	var Istanbul = require('istanbul'),
		mkdirp = require('mkdirp');

	coffeeBreak.registerTask('codecoverage', function(conf, logger, done) {
		console.log('Run code coverage', conf.files);

		var files = conf.files,
			tmpDir = path.join(conf.cwd, '~cb-tmp/instrumented');

		console.log('Code coverage out dir:', tmpDir);

		files = files.map(function(file) {
			console.log('File:', file);
			var source = fs.readFileSync(conf.cwd + '/' + file, 'utf8');
			var instrumenter = new Istanbul.Instrumenter(),
				instrumented = instrumenter.instrumentSync(source, file);

			mkdirp.sync(path.dirname(tmpDir + '/' + file));
			fs.writeFileSync(tmpDir + '/' + file, instrumented);

			console.log('Write instrumented file:', tmpDir + '/' + file);
			return path.join('~cb-tmp/instrumented', file);
		});

		conf.files = files;

		console.log('Conf after instrumentation', conf);

		done();
	});

	coffeeBreak.registerTask('report', function(conf, logger, done) {

	});

	var generateReport = function(conf) {
		var result = {"lib/lib1.js":{"path":"lib/lib1.js","s":{"1":1,"2":0},"b":{},"f":{"1":0},"fnMap":{"1":{"name":"(anonymous_1)","line":2,"loc":{"start":{"line":2,"column":7},"end":{"line":2,"column":18}}}},"statementMap":{"1":{"start":{"line":1,"column":0},"end":{"line":5,"column":2}},"2":{"start":{"line":3,"column":2},"end":{"line":3,"column":17}}},"branchMap":{}},"lib/lib2.js":{"path":"lib/lib2.js","s":{},"b":{},"f":{},"fnMap":{},"statementMap":{},"branchMap":{}},"lib/lib3.js":{"path":"lib/lib3.js","s":{},"b":{},"f":{},"fnMap":{},"statementMap":{},"branchMap":{}},"modulea.js":{"path":"modulea.js","s":{"1":1},"b":{},"f":{},"fnMap":{},"statementMap":{"1":{"start":{"line":1,"column":0},"end":{"line":1,"column":6}}},"branchMap":{}},"superModule.js":{"path":"superModule.js","s":{},"b":{},"f":{},"fnMap":{},"statementMap":{},"branchMap":{}}};

		var Store = Istanbul.Store,
			store = Store.create('memory');

		for (var key in result) {
			var source = fs.readFileSync(conf.cwd + '/' + key, 'utf8');
			// console.log('Addsource of:', key, source);
			store.set(key, source);
		}

		store.dispose();

		var Report = require('istanbul').Report,
			report = Report.create('html'),
			collector = new Istanbul.Collector();

		collector.add(result);

		// console.log('Write result');
		report.writeReport(collector,{
			sourceStore: store
		});
	};
};