'use strict';

const express = require('express'),
    home = express.Router();

home.get('/', (req, res) => res.render('home'));

console.log('Main endpoint at /');

module.exports = home;