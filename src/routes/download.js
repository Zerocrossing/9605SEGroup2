'use strict';
var express = require('express');
var router = express.Router();
const querystring = require('querystring');
var db = require('../Auxiliaries/database');


/* GET about listing. */
router.get('/', async function (req, res) {
    // get query (identical to search query) and find filepaths
    let query = querystring.decode(req.query.download);
    //todo this returns nothing currently
    let filePaths = await db.getPathsFromQuery(query);
    console.log("Found file paths: ", filePaths);
    res.render('download', {title: 'Nature\'s Palette'});
});

module.exports = router;
