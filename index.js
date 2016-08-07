'use strict';

exports.createServer = function (config) {
	const Server = require('./lib/server');
	return new Server(config);
};

exports.createClient = function () {
	const Client = require('./lib/client');
	return new Client();
};

const express = require('express'),
	path = require('path'),
	favicon = require('serve-favicon'),
	logger = require('morgan'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	home = require('./server/controllers/home'),
	app = express();

app.set('views', path.join(__dirname, 'public'))
	.set('view engine', 'ejs')
	.use(express.static('public'))
	.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
	.use(logger('dev'))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }))
	.use(cookieParser())
	.use('/', home);

const listener = app.listen(8888, () =>
	console.log(`Listening on port ${listener.address().port}`));

module.exports = app;