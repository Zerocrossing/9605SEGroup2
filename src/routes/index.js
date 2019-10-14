'use strict';
const express = require('express');
// DB COMMENTED OUT FOR ASSIGN 1
//const mongojs = require('mongojs');
const fs = require('fs');

let router = express.Router();

/*const db = mongojs('localhost/natureDB', [
    'files',
    'users'
]);*/

let fileCache = [];

/* GET home page. */
router.get('/', function (req, res) {
    /*db.files.find().sort([['_id', -1]], function (err2, res2) {
        if (err2) {
            console.log(err);
            return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).' });
        }

        let fileArr = [];
        for (let i = 0; i < res2.length; i++) {
            fileArr.push(res2[i].file);
        }

        res.render('index', { title: 'Nature\'s Palette', files: fileArr });
    });*/

    fs.readdir("./uploads/", function (err, items) {
        if (err) {
            console.log(err);
            return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache });
        }

        fileCache = items;
        res.render('index', { title: 'Nature\'s Palette', files: items });
    });
});

module.exports = router;
