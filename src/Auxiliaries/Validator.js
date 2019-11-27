const common = require('../Auxiliaries/common.js');
const config = require('../config.json');
var assert = require('assert');

function validateSubmission(req) {
    let rawFiles = req.files.raw;
    let metaFile = req.files.meta;
    let basicInfo = req.body;
    let rawFileNames = [];
    let retVal = common.csvJSON(metaFile.data.toString());

    if (typeof rawFiles.length === 'undefined') {
        rawFiles = [rawFiles];
    }

    for (let i = 0; i < rawFiles.length; i++) {
        let name = rawFiles[i].name;
        if (name.substr(name.length - 3) === 'zip') {
            let ret = common.getZippedFileNames(rawFiles[i])
            rawFileNames = rawFileNames.concat(ret.rawFileNames)
        } else {
            rawFileNames.push(name);
        }
    }

    let v1 = matchRawFilesAndMetadataFiles(rawFileNames, retVal.fileNames, retVal.json);
    let v2 = checkMandatoryFields(retVal.json, basicInfo);
    // add extension to metadata file, only place they are together
    return {
        isValid: (v1.isValid && v2.isValid),
        json: retVal.json,
        message: v1.message + '\n' + v2.message
    };
}


function matchRawFilesAndMetadataFiles(rawFileNames, metadataRawFileNames, metaFile) {
    rawFileNames.sort();
    metadataRawFileNames.sort();
   // assert(rawFileNames.length == metadataRawFileNames.length);
   //  console.log("MAtch : rawFileNames " + rawFileNames + "length:" + rawFileNames.length)
   //  console.log("metadataRawFileNames " + metadataRawFileNames + "length:" + metadataRawFileNames.length)
    if(rawFileNames.length != metadataRawFileNames.length)
        return {
            isValid: false,
            message: "Raw Files don't match the metadata!"
        }
    metaFile.sort(function (a, b) {
        return a["FileName"].localeCompare(b["FileName"]);
    });
    //remove valid extensions from all filenames
    for (let i = 0; i < rawFileNames.length; i++) {
        splitFileName = removeKnownExtensions(rawFileNames[i]);
        rawFileNames[i] = splitFileName.head;
        metaFile[i].extension = splitFileName.tail;
    }
    for (let i = 0; i < metadataRawFileNames.length; i++) {
        metadataRawFileNames[i] = removeKnownExtensions(metadataRawFileNames[i]).head;
    }
    let rawFileNamesStr = rawFileNames.toString();
    let metadataRawFileNamesStr = metadataRawFileNames.toString();
    if (rawFileNamesStr.toLowerCase().localeCompare(metadataRawFileNamesStr.toLowerCase()) != 0) {
        return {
            isValid: false,
            message: "Raw Files don't match the metadata!"
        }
    }
    return {
        isValid: true,
        message: ""
    }
}

function removeKnownExtensions(fileName) {
    let ret = {head: fileName, tail: ""};
    for (let j = 0; j < config.rawFileExtension.length; j++) {
        let extension = config.rawFileExtension[j];
        let exLen = extension.length;
        fileTail = fileName.slice(-exLen);
        if (fileTail === extension) {
            ret.head = fileName.substring(0, fileName.length - exLen);
            ret.tail = fileName.slice(-exLen);
        }
    }
    //no match found
    return ret
}

function checkMandatoryFields(json, basicInfo) {
    let isValid = true;
    let emptyMandatoryFields = "";
    let mandatoryFields = ['FileName', 'genus', 'specificEpithet', 'Patch', 'LightAngle1', 'LightAngle2', 'ProbeAngle1', 'ProbeAngle2', 'Replicate']
    if (basicInfo.dataFrom === 'museum') {
        mandatoryFields = mandatoryFields.concat(['institutionCode', 'catalogueNumber']);
    } else if (basicInfo.dataFrom === 'field') {
        mandatoryFields = mandatoryFields.concat(['UniqueID']);
    }

    json.forEach(function (item, index) {
        mandatoryFields.forEach(function (item1, index1) {
            if (typeof (item[item1]) === 'undefined' || item[item1] === '') {
                isValid = false;
                emptyMandatoryFields += 'Row ' + (index + 1) + ': Attribute: ' + item1 + ', value: ' + item[item1] + ', FileName: ' + item['FileName'] + "\n";
            }
        });
    });

    return {
        isValid: isValid,
        message: isValid == false ? "Some mandatory fields are empty:\n" + emptyMandatoryFields : ""
    }
}

function validateModificationSubmission(metadata, rawFiles,metaRawFilenames,submission) {
   // let rawFiles = rawFiles;
   // let metaFile = req.files.meta;
  //  let basicInfo = req.body;

    let rawFileNames = [];
    let basicInfo = {"dataFrom" : submission["submitType"]}
 //   let retVal = common.csvJSON(metaFile.data.toString());

    if (typeof rawFiles.length === 'undefined') {
        rawFiles = [rawFiles];
    }

    for (let i = 0; i < rawFiles.length; i++) {
        let name = rawFiles[i].name;
        if (name.substr(name.length - 3) === 'zip') {
            let ret = common.getZippedFileNames(rawFiles[i])
            console.log("ret ------" + ret.rawFileNames)
            rawFileNames = rawFileNames.concat(ret.rawFileNames)
        } else {
            rawFileNames.push(name);
        }
    }

    let v1 = matchRawFilesAndMetadataFiles(rawFileNames, metaRawFilenames, metadata);
    let v2 = checkMandatoryFields(metadata, basicInfo);
    // add extension to metadata file, only place they are together
    return {
        isValid: (v1.isValid && v2.isValid),
       // json: retVal.json,
        message: v1.message + '\n' + v2.message
    };
}

function validateModificationSubmission(meta,raw, basicInfo, metaRawfileNames) {
  //  let rawFiles = req.files.raw;
  //  let metaFile = req.files.meta;
  //  let basicInfo = req.body;

    let rawFileNames = [];
  //  let retVal = common.csvJSON(metaFile.data.toString());

    if (typeof raw.length === 'undefined'){
        raw = [raw];
    }

    for (let i = 0; i < raw.length; i++) {
        let name = raw[i].name;
        if (name.substr(name.length - 3) === 'zip') {
            let ret = common.getZippedFileNames(raw[i])
            rawFileNames = rawFileNames.concat(ret.rawFileNames)
        } else {
            rawFileNames.push(name);
        }
    }

    let v1 = matchRawFilesAndMetadataFiles(rawFileNames, metaRawfileNames);
    let v2 = checkMandatoryFields(meta, basicInfo);

    return {
        isValid: (v1.isValid && v2.isValid),
        //json: retVal.json,
        message: v1.message + '\n' + v2.message
    };
}

exports.validateSubmission = validateSubmission;
exports.validateModificationSubmission = validateModificationSubmission;