'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');
const config = require('../config.json');

// Login page render
router.get('/', function (req, res) {
    res.render('login', {title: 'Nature\'s Palette'});
});

module.exports = router;
