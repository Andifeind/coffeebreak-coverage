module.exports = function(coffeeBreak) {
    "use strict";

    var fs = require('fs'),
        path = require('path');

    var Istanbul = require('istanbul'),
        mkdirp = require('mkdirp');

    var isCodeCoverageEnabled = false,
        isReportWritten = false;

    coffeeBreak.registerTask('coverage', function(conf, logger, done) {
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

        isCodeCoverageEnabled = true;
        coffeeBreak.socket.once('cov-report', function(covObj) {
            isReportWritten = true;
            
            var outDir = path.join(conf.tmpDir, 'coverage/html-cov');

            var Report = Istanbul.Report,
                report = Report.create('html', {
                    dir: outDir
                }),
                collector = new Istanbul.Collector();

            collector.add(covObj);
            console.log('COV', outDir);
            report.writeReport(collector, true);
            logger.dev('Write coverage HTML report to', outDir);

            outDir = path.join(conf.tmpDir, 'coverage/json-cov');
            report = Report.create('json', {
                dir: outDir
            });

            report.writeReport(collector, true);
            logger.dev('Write coverage JSON report to', outDir);
        });

        done();
    });


    coffeeBreak.registerTask('report', function(conf, logger, done) {
        if (isReportWritten) {
            done();
            return;
        }

        coffeeBreak.socket.once('end', function() {
            done();
        });
    });
};