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
    res.render('download', {title: 'Nature\'s Palette'});
});

module.exports = router;

//upon being passed the result of a mongoquery this returns a zip containing all the local files
function getZipFromFilePaths(queryResult) {
    for (const path of queryResult){
        //todo
    }
}