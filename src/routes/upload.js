'use strict';
var express = require('express');
var router = express.Router();
var validator = require('../Auxiliaries/Validator')
const db = require('../Auxiliaries/database')

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

    if (validator.validateSubmission(req)) {
        res.render('upload', { title: 'Nature\'s Palette', msg: 'Files successfully uploaded!' });
        validator.validate(req.files.raw);
    }
    else {
        res.render('upload', { title: 'Nature\'s Palette', msg: 'There was an error uploading the files.' });
    }
});

module.exports = router;