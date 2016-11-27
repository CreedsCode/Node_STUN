'use strict';

const express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    home = require('../controllers/home'),
    app = express(),
    config = require('../../config'),
    stun = require('../stun'),
    stunServer = stun.createServer(config.stun);

module.exports = {
    createServer: () => {
        app.set('views', path.join(__dirname, '../../public'))
            .set('view engine', 'ejs')
            .use(express.static('public'))
            .use(favicon(path.join(__dirname, '../../public', 'favicon.ico')))
            .use(logger('dev'))
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({extended: false}))
            .use(cookieParser())
            .use('/', home);

        const listener = app.listen(config.server.port, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log(`Express server listening on port ${listener.address().port}`);
            }
        })
    },
    stunServer
};