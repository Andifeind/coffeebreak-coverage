module.exports = function(coffeeBreak) {
    "use strict";

    var fs = require('fs'),
        path = require('path');

    var Istanbul = require('istanbul'),
        mkdirp = require('mkdirp'),
        rmdir = require('rmdir');

    var isCodeCoverageEnabled = false,
        isReportWritten = false;

    var writeReport = function(conf, covObj, logger) {
        isReportWritten = true;

        process.chdir(conf.cwdOrig);
        
        var outDir = path.join(conf.tmpDir, 'coverage/html-cov');

        var Report = Istanbul.Report,
            report = Report.create('html', {
                dir: outDir
            }),
            collector = new Istanbul.Collector();

        collector.add(covObj);
        report.writeReport(collector, true);
        logger.dev('Write coverage HTML report to', outDir);

        outDir = path.join(conf.tmpDir, 'coverage/json-cov');
        report = Report.create('json', {
            dir: outDir
        });

        report.writeReport(collector, true);
        logger.dev('Write coverage JSON report to', outDir);
    };

    coffeeBreak.registerTask('coverage', function(conf, logger, done) {
        logger.dev('Run code coverage for project: ' + conf.project, conf.files);

        var files = conf.files,
            tmpDir = path.join(conf.cwd, '.cb-tmp');

        isCodeCoverageEnabled = true;
        logger.dev('Write covered files to:', tmpDir);

        files = files.map(function(file) {
            var source = fs.readFileSync(conf.cwd + '/' + file, 'utf8');
            var instrumenter = new Istanbul.Instrumenter(),
                instrumented = instrumenter.instrumentSync(source, file);

            mkdirp.sync(path.dirname(tmpDir + '/' + file));
            fs.writeFileSync(tmpDir + '/' + file, instrumented);

            logger.dev('Write instrumented file:', tmpDir + '/' + file);
            return path.join('.cb-tmp', file);
        });

        // conf.files = files;

        //Move tests
        conf.tests.map(function(file) {
            mkdirp.sync(path.dirname(tmpDir + '/' + file));
            if (!fs.existsSync(tmpDir + '/' + file)) {
                fs.linkSync(conf.cwd + '/' + file, tmpDir + '/' + file);
            }
        });

        conf.cwdOrig = conf.cwd;
        conf.cwd = tmpDir;

        if (conf.browser) {
            coffeeBreak.socket.once('cov-report', function(covObj) {
                writeReport(conf, covObj, logger);
            });
        }

        done();
    });


    coffeeBreak.registerTask('report', function(conf, logger, done) {
        if (!isCodeCoverageEnabled) {
            done();
            return;
        }

        if (!conf.browser) {
            writeReport(conf, require(conf.cwd + '/mocha-coverage.json'), logger);
            done();
            return;
        }

        if (isReportWritten || !isCodeCoverageEnabled) {
            done();
            return;
        }

        coffeeBreak.socket.once('end', function() {
            done();
            return;
        });
    });

    coffeeBreak.registerTask('clean', function(conf, logger, done) {
        if (!isCodeCoverageEnabled) {
            done();
            return;
        }

        logger.dev('Remove tmp dir', conf.cwdOrig + '/.cb-tmp');
        rmdir(conf.cwdOrig + '/.cb-tmp', function() {
            done();
        });
    });
};