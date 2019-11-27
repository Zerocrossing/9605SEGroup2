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

    zipEntries.forEach(function (zipEntry) {
        if(zipEntry["isDirectory"] == false)
            rawfilenames.push(zipEntry.name);
    });

    return {
        rawFileNames: rawfilenames
    };
}

function extractZippedFile(zippedRawFiles, path){
    var zip = new admzip(zippedRawFiles.data);
    zip.extractAllTo(path,true);
    moveFiles(path,path);
    let items = fs.readdirSync(path)
    for (var i=0; i<items.length; i++) {
        let filePath = path + "/" + items[i];
        let isDir = fs.statSync(filePath).isDirectory();
        if (isDir) {
            fs.rmdirSync(filePath, {recursive:true});
        }
    }
}

function moveFiles(pathOG, pathNew){
    items = fs.readdirSync(pathNew);
        for (var i=0; i<items.length; i++) {
            let isDir = fs.statSync(pathNew+"/"+items[i]).isDirectory();
            if (isDir){
                moveFiles(pathOG, pathNew+"/"+items[i]);
            }
            else{
                //move file
                let oldPath = pathNew+"/"+items[i];
                let newPath = pathOG + "/"+items[i];
                fs.renameSync(oldPath,newPath);
            }

        }
}

exports.csvJSON = csvJSON;
exports.getZippedFileNames = getZippedFileNames;
exports.extractZippedFile = extractZippedFile;