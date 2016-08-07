#!/usr/bin/env node
'use strict';

// Load config (ini) file.
const config = (() => {
	const fs = require('fs'),
		path = require('path'),
		ini = require('ini'),
		_ = require('lodash'),
		root = process.cwd(),
		iniPath = path.join(root, 'node-stun.ini');
	var config = {};
	try {
		config = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
	} catch (e) {
		if (e.code === 'ENOENT') {
			console.warn('Config file not found:', e);
		} else {
			throw e;
		}
	}
	var defaults = {
		primary: {
			host: '127.0.0.1',
			port: '3478'
		},
		secondary: {
			host: '127.0.0.2',
			port: '3479'
		}
	};

	return _.defaultsDeep(config, defaults);
})();


const stun = require('../index'),
	server = stun.createServer(config);

// Set log event handler
server.on('log', (log) => {
	console.log('%s : [%s] %s', new Date(), log.level, log.message);
});

// Start listening
server.listen();

