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
let descriptionCache = {};

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
            return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache, descriptions: descriptionCache });
        }

        updateCaches(items, function (err3) {
            if (err3) {
                console.log(err3);
                return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache, descriptions: descriptionCache });
            }

            res.render('index', { title: 'Nature\'s Palette', files: fileCache, descriptions: descriptionCache });
        });
    });
});

function updateCaches(items, callback) {
    fileCache = [];
    if (items.length <= 0) {
        descriptionCache = {};
        callback(null);
    }

    let count = 0;
    for (let i in items) {
        fs.readFile("./uploads/" + items[i], function (err, data) {
            if (err) {
                callback(err);
            }

            console.log(items[i]);

            if (items[i].length > 11 && items[i].substr(items[i].length - 11) == 'description') {

                let descName = items[i].substring(0, items[i].length - 12);
                descriptionCache[descName] = data;
            }
            else { fileCache.push(items[i]); }

            if (count >= items.length - 1) {
                callback(null);
            }
            count++;
        });
    }
}

module.exports = router;
