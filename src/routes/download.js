'use strict';
var express = require('express');
var router = express.Router();
const querystring = require('querystring');
var db = require('../Auxiliaries/database');
const admzip = require('adm-zip');
const config = require('../config.json');
var fs = require('fs');

/* GET about listing. */
router.get('/', async function (req, res) {
    // get query (identical to search query) and find filepaths
    let query = querystring.decode(req.query.download);
    query.visibleOnly = true;
    let filesZip = new admzip();
    let filePaths = await db.getPathsFromQuery(query, filesZip);
    addFilesToZip(filePaths, filesZip);
    let uberZip = new admzip();
    let csv = await makeCSV(query);
    let sendMe = await filesZip.toBuffer();
    uberZip.addFile("files.zip", sendMe);
    uberZip.addFile("metadata.csv",csv);
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

//takes in the result of a query and renders a csv fileobject
async function makeCSV (query){
    let out = ""; //write all contents to string then convert it to buffer
    //get CSV headers from template files
    let csvHeaders = [];
    let metaData = await db.getQueryResults(query);
    for (let templatePath of config.templateFiles){
        let headers = fs.readFileSync(templatePath).toString().split(',');
        for (let header of headers){
            header = header.trim();
            if (csvHeaders.includes(header)){
                continue;
            }
            csvHeaders.push(header);
            out+=header + ','
        }
    }
    //take results from query and add them
    let results = await db.getQueryResults(query);
    for (let result of results){
        let csvRow = "\n"
        for (let header of csvHeaders){
            csvRow+=result[header] +","
        }
        out+= csvRow;
    }
    return Buffer.from(out);
}