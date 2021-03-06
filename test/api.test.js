/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @ts-check

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const spdlog = require('..');

suite('API', function () {

	var tempDirectory;
	var logFile;
	var EOL = '\n';
	var testObject;

	var filesToDelete = [];

	suiteSetup(() => {
		tempDirectory = path.join(__dirname, 'logs');
		if (!fs.existsSync(tempDirectory)) {
			fs.mkdirSync(tempDirectory);
		}
		logFile = path.join(tempDirectory, 'test.log');
		filesToDelete.push(logFile);
		if (fs.existsSync(logFile)) {
			fs.unlinkSync(logFile);
		}

		if (typeof process === 'object') {
			if (process.platform === 'win32') {
				EOL = '\r\n';
			}
		} else if (typeof navigator === 'object') {
			let userAgent = navigator.userAgent;
			if (navigator.userAgent.indexOf('Windows') >= 0) {
				EOL = '\r\n'
			}
		}
	});

	teardown(() => {
		if (testObject) {
			testObject.drop();
		}
	});

	suiteTeardown(() => {
		filesToDelete.forEach(file => {
			if (fs.existsSync(file)) {
				fs.unlinkSync(file);
			}
		});
	});

	test('is loaded', function () {
		const spdloghPath = path.join(__dirname, '..', 'deps', 'spdlog', 'include', 'spdlog', 'common.h');
		const contents = fs.readFileSync(spdloghPath, 'utf8');
		const version = /SPDLOG_VERSION "([\d\.]+)"/.exec(contents)[1];

		assert.equal(spdlog.version, version);
	});

	test('is loaded', function () {
		const spdloghPath = path.join(__dirname, '..', 'deps', 'spdlog', 'include', 'spdlog', 'common.h');
		const contents = fs.readFileSync(spdloghPath, 'utf8');
		const version = /SPDLOG_VERSION "([\d\.]+)"/.exec(contents)[1];

		assert.equal(spdlog.version, version);
	});

	test('Logger is present', function () {
		assert(typeof spdlog.Logger === 'function');
	});

	test('Create rotating logger', function () {
		testObject = aTestObject(logFile);
		assert.ok(fs.existsSync(logFile));
	});

	test('Log critical message', function () {
		testObject = aTestObject(logFile);
		testObject.critical('Hello World');

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [critical] Hello World'));
	});

	test('Log error', function () {
		testObject = aTestObject(logFile);
		testObject.error('Hello World');
		testObject.flush();

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [error] Hello World'));
	});

	test('Log warning', function () {
		testObject = aTestObject(logFile);
		testObject.warn('Hello World');

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [warning] Hello World'));
	});

	test('Log info', function () {
		testObject = aTestObject(logFile);
		testObject.info('Hello World');

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [info] Hello World'));
	});

	test('Log debug', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(1);
		testObject.debug('Hello World');

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [debug] Hello World'));
	});

	test('Log trace', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(0);
		testObject.trace('Hello World');

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [trace] Hello World'));
	});


	test('set level', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(0);
		assert.equal(testObject.getLevel(), 0);

		testObject.setLevel(1);
		assert.equal(testObject.getLevel(), 1);

		testObject.setLevel(2);
		assert.equal(testObject.getLevel(), 2);

		testObject.setLevel(3);
		assert.equal(testObject.getLevel(), 3);

		testObject.setLevel(4);
		assert.equal(testObject.getLevel(), 4);

		testObject.setLevel(5);
		assert.equal(testObject.getLevel(), 5);

		testObject.setLevel(6);
		assert.equal(testObject.getLevel(), 6);
	});

	test('Off Log', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(6);
		testObject.critical('This message should not be written');
		testObject.flush();

		const actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [critical] This message should not be written'));
	});

	test('set log level to trace', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(0);
		testObject.trace('This trace message should be written');

		let actual = getLastLine();
		assert.ok(actual.endsWith('[test] [trace] This trace message should be written'));
	});

	test('set log level to debug', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(1);
		testObject.trace('This trace message should not be written');

		let actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [trace] This trace message should not be written'));
	});

	test('set log level to info', function () {
		testObject = aTestObject(logFile);
		testObject.setLevel(2);
		testObject.trace('This trace message should not be written');
		testObject.flush();

		let actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [trace] This trace message should not be written'));

		testObject.debug('This debug message should not be written');

		actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [debug] This debug message should not be written'));
	});

	test('set global log level to trace', function () {
		testObject = aTestObject(logFile);
		spdlog.setLevel(0);

		testObject.trace('This trace message should be written');

		const actual = getLastLine();
		assert.ok(actual.endsWith('[test] [trace] This trace message should be written'));
	});

	test('set global log level to debug', function () {
		testObject = aTestObject(logFile);
		spdlog.setLevel(1);

		testObject.trace('This trace message should not be written');

		let actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [trace] This trace message should not be written'));
	});

	test('set global log level to info', function () {
		testObject = aTestObject(logFile);
		spdlog.setLevel(2);

		testObject.trace('This trace message should not be written');

		let actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [trace] This trace message should not be written'));

		testObject.debug('This debug message should not be written');

		actual = getLastLine();
		assert.ok(!actual.endsWith('[test] [debug] This debug message should not be written'));
	});

	test('drop logger and create logger with same name and same file', function () {
		testObject = aTestObject(logFile);
	});

	test('set async mode', function () {
		spdlog.setAsyncMode(8192, 2000);
	});

	test('set pattern', function () {
		testObject = aTestObject(logFile);

		testObject.setPattern('%v');

		testObject.info('This message should be written as is');

		const actual = getLastLine();
		assert.equal(actual, 'This message should be written as is');
	});

	test('clear formatters', function () {
		testObject = aTestObject(logFile);

		testObject.clearFormatters();

		testObject.info('Cleared Formatters: ');
		testObject.info('This message ');
		testObject.info('should be ');
		testObject.info('written ');
		testObject.info('as is');

		const actuals = getAllLines();
		assert.equal(actuals[actuals.length - 1], 'Cleared Formatters: This message should be written as is');
	});

	test('create log file with special characters in file name', function () {
		let file = path.join(__dirname, 'abcdø', 'test.log');
		filesToDelete.push(file);
		testObject = new spdlog.RotatingLogger('test', file, 1048576 * 5, 2);
	});

	function getLastLine() {
		const lines = getAllLines();
		return lines[lines.length - 2];
	}

	function aTestObject(logfile) {
		const logger = new spdlog.RotatingLogger('test', logfile, 1048576 * 5, 2);
		logger.setPattern('%+');
		return logger;
	}

	function getAllLines() {
		testObject.drop();
		const content = fs.readFileSync(logFile).toString();
		testObject = aTestObject(logFile);
		return content.split(EOL);
	}

});