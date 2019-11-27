const admzip = require('adm-zip');
const config = require('../config.json');
const fs = require('fs');

function csvJSON(csv) {
    var result = [];
    var fileNamesArr = [];
    var lines = csv.trim().split("\r\n");
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split(",");

        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
        fileNamesArr.push(obj['FileName']);
    }

    return {
        json: JSON.parse(JSON.stringify(result)),
        fileNames: fileNamesArr,
    };
}

function getZippedFileNames(zippedRawFiles){
    let rawfilenames=[];
    var zip = new admzip(zippedRawFiles.data);
    var zipEntries = zip.getEntries();

    console.log("zipEntries:"+ zipEntries)
    console.log("*******"+ JSON.stringify(zipEntries))
    zipEntries.forEach(function (zipEntry) {
        if(zipEntry["isDirectory"] == false)
            rawfilenames.push(zipEntry.name);
    });

    console.log("**rawfilenames" + rawfilenames)
    return {
        rawFileNames: rawfilenames
    };
}

function extractZippedFile(zippedRawFiles, path){
    var zip = new admzip(zippedRawFiles.data);
    zip.extractAllTo(path,true)
}

exports.csvJSON = csvJSON;
exports.getZippedFileNames = getZippedFileNames;
exports.extractZippedFile = extractZippedFile;