'use strict';
var express = require('express');
var router = express.Router();
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
    //DEBUG display the names of the files and make a fake request to the DB
    var out = '';
    // multiple files are stored in an array
    if (Array.isArray(req.files.uploaded)) {
        for (var file in req.files.uploaded) {
            var fileObj = req.files.uploaded[file];
            db.post(fileObj);
            out += fileObj.name + '<br>';
        }
    //single files an object
    } else {
        db.post(req.files.uploaded);
        out += req.files.uploaded.name;
    }
    res.send('You uploaded these files:<br>' + out);

});

module.exports = router;