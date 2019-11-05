'use strict';
var express = require('express');
var router = express.Router();
var validator = require('../Auxiliaries/Validator')
const db = require('../database')

// Upload page render
router.get('/', function (req, res) {
    res.render('upload', {title: 'Nature\'s Palette'});
});

// Post request: uploaded files
router.post('/', function (req, res) {
    // null file check
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let isValid = validator.validateSubmission(req)
    console.log(isValid?'submission is valid':'submission is invalid')

});

module.exports = router;