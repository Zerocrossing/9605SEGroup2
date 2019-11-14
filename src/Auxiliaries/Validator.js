const { fork } = require('child_process');
const common = require('../Auxiliaries/common.js')
const fs = require('fs');
var nodemailer = require('nodemailer');

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
           }
        else {
            rawFileNames.push(name);
        }
    }

    let v1 = matchRawFilesAndMetadataFiles(rawFileNames, retVal.fileNames);
    let v2 = checkMandatoryFields(retVal.json, basicInfo);

    return{
        isValid: (v1.isValid & v2.isValid),
        json: JSON.parse(retVal.json),
        message: v1.message + '\n' + v2.message
    } ;
}

function matchRawFilesAndMetadataFiles(rawFileNames, metadataRawFileNames) {
    rawFileNames.sort();
    metadataRawFileNames.sort();
    /*for (let i = 0; i < rawFileNames.length; i++) {
        console.log(rawFileNames[i] + " =? " + metadataRawFileNames[i]);
    }*/

   for(let i=0; i<rawFileNames.length ; i++){
        rawFileNames[i] = rawFileNames[i].substr(0,rawFileNames[i].length - 20)
    }

    let rawFileNamesStr = rawFileNames.toString();
    let metadataRawFileNamesStr = metadataRawFileNames.toString();

    if (rawFileNamesStr.toLowerCase().localeCompare(metadataRawFileNamesStr.toLowerCase())!=0)
        return {
        isValid : false,
            message:"Raw Files don't match the metadata!"
        }

    return {
        isValid : true,
        message:""
    }
}

function checkMandatoryFields(json, basicInfo){
    //should be in config
    let isValid=true;
    let jsonObj = JSON.parse(json);
    let emptyMandatoryFields = [];
    let mandatoryFields = ['filename', 'genus', 'specificepithet', 'patch', 'lightangle1', 'lightangle2', 'probeangle1', 'probeangle2', 'replicate']
    if (basicInfo.dataFrom === 'museum') {
        mandatoryFields.concat(['institutioncode', 'cataloguenumber']);
    }
    else if (basicInfo.dataFrom === 'field') {
        mandatoryFields.concat(['uniqueid']);
    }

    jsonObj.forEach(function(item, index) {
        mandatoryFields.forEach(function(item1, index1) {
            if (item[item1] === '') {
                isValid = false;
                emptyMandatoryFields.push('field:\n Row: ', index + 1, '| Attribute: ', item1 + ' value : ' + item[item1] + 'file' + item['FileName'])
                // console.log('fields:\n Row: ',index+1,'| Attribute: ',item1+ ' value : '+item[item1]+'file'+ item['FileName']);
            }
        });
    });

    return {
        isValid : isValid,
        message:isValid==false?"Some mandatory fields are empty:\n"+emptyMandatoryFields:""
    }
}

exports.validateSubmission = validateSubmission;
// exports.validate = validate;