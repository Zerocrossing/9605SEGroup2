const jszip = require('jszip');
const admzip = require('adm-zip')
const config = require('../config.json');
var fs = require('fs')

function csvJSON(csv) {

    var lines = csv.split("\r\n");

    var result = [];
    var fileNamesArr = [];

    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {

        var obj = {};
        var currentline = lines[i].split(",");

        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
            if (j == 0 && currentline[0] != '') {
                fileNamesArr.push(currentline[0])
            }
        }
        if (typeof (obj['institutionCode']) !== 'undefined')
            result.push(obj);
    }

    //return result; //JavaScript object
    return {
        json: JSON.stringify(result),
        fileNames: fileNamesArr,
    };

}
function getZippedFileNames(zippedRawFiles){

    let rawfilenames=[];
    var zip = new admzip(zippedRawFiles.data);
    var zipEntries = zip.getEntries();

    zipEntries.forEach(function(zipEntry) {
        if (zipEntry.name.substr(zipEntry.name.length - config.rawFileExtensionLength) === config.rawFileExtension)
            rawfilenames.push(zipEntry.name);
    });


   return {
            rawFileNames:rawfilenames
    };
}
function extractZippedFile(zippedRawFiles, path){
    var zip = new admzip(zippedRawFiles.data);
    zip.extractAllTo(path,true)
}

exports.csvJSON = csvJSON;
exports.getZippedFileNames = getZippedFileNames;
exports.extractZippedFile = extractZippedFile;