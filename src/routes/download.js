'use strict';
var express = require('express');
var router = express.Router();
const querystring = require('querystring');
var db = require('../Auxiliaries/database');
const admzip = require('adm-zip');


/* GET about listing. */
router.get('/', async function (req, res) {
    // get query (identical to search query) and find filepaths
    let query = querystring.decode(req.query.download);
    let filesZip = new admzip();
    let filePaths = await db.getPathsFromQuery(query, filesZip);
    addFilesToZip(filePaths, filesZip);
    let uberZip = new admzip();
    let sendMe = await filesZip.toBuffer();
    uberZip.addFile("files.zip", sendMe);
    //todo add csv to uberzip
    res.contentType('zip');
    res.send(uberZip.toBuffer());
});

module.exports = router;

//upon being passed the result of a mongoquery this returns a zip containing all the local files
function addFilesToZip(queryResult, zip) {
    for (const result of queryResult) {
        let path = result["filePath"] + result["extension"];
        zip.addLocalFile(path);
    }
    return zip;
}