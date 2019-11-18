﻿'use strict';
var express = require('express');
var router = express.Router();
var validator = require('../Auxiliaries/Validator')
const db = require('../Auxiliaries/database')
const common = require('../Auxiliaries/common.js');


// Upload page render
router.get('/', function (req, res) {
    res.render('upload', {title: 'Nature\'s Palette', msg: ''});
});

// Post request: uploaded files
router.post('/', function (req, res) {
    // null file check
    if (!req.files || !req.files.meta || !req.files.raw || Object.keys(req.files.meta).length === 0 || Object.keys(req.files.raw).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    let validationStatus = validator.validateSubmission(req)
    if (validationStatus.isValid) {
        res.render('upload', {title: 'Nature\'s Palette', msg: 'Files successfully uploaded!'});
        db.saveData(validationStatus.json, req.files.raw)
    } else {
        res.render('upload', {title: 'Nature\'s Palette', msg: 'There was an error uploading the files.\n' + validationStatus.message});
    }
});

module.exports = router;