'use strict';
var express = require('express');
var router = express.Router();

/* GET about listing. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Nature\'s Palette', user: req.session.userInfo});
});

module.exports = router;