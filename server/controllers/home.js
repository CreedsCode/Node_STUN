const express = require('express'),
	home = express.Router();

home.get('/', (req, res) => res.render('home'));

module.exports = home;