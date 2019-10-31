'use strict';
var express = require('express');
var router = express.Router();

/* GET about listing. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Nature\'s Palette' });
});

module.exports = router;