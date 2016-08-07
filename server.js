'use strict';

const express = require('express'),
	path = require('path'),
	favicon = require('serve-favicon'),
	logger = require('morgan'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	home = require('./server/controllers/home'),
	app = express(),
	config = require('./config'),
	stun = require('./server/stun');

stun.createServer(config.stun);

app.set('views', path.join(__dirname, 'public'))
	.set('view engine', 'ejs')
	.use(express.static('public'))
	.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
	.use(logger('dev'))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }))
	.use(cookieParser())
	.use('/', home);

const listener = app.listen(config.server.port, () =>
	console.log(`Express Server listening on port ${listener.address().port}`));

module.exports = app;