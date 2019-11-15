const common = require('../Auxiliaries/common.js');
const config = require('../config.json');

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
        isValid: (v1.isValid && v2.isValid),
        json: JSON.parse(retVal.json),
        message: v1.message + '\n' + v2.message
    } ;
}

function matchRawFilesAndMetadataFiles(rawFileNames, metadataRawFileNames) {
    rawFileNames.sort();
    metadataRawFileNames.sort();

    for (let i = 0; i < rawFileNames.length; i++) {
        let FoundExtension = false;
        for (let j = 0; j < config.rawFileExtension.length; j++) {
            if (rawFileNames[i].length > config.rawFileExtension[j].length) {
                let nameExtension = rawFileNames[i].substr(config.rawFileExtension[j].length);
                if (nameExtension === config.rawFileExtension[j]) {
                    FoundExtension = true;
                    rawFileNames[i] = rawFileNames[i].substr(0, config.rawFileExtension[j].length);
                    break;
                }
            }
        }
        if (!FoundExtension) {
            rawFileNames[i] = rawFileNames[i].replace(/\.[^/.]+$/, '');
        }
    }

    let rawFileNamesStr = rawFileNames.toString();
    let metadataRawFileNamesStr = metadataRawFileNames.toString();

    if (rawFileNamesStr.toLowerCase().localeCompare(metadataRawFileNamesStr.toLowerCase()) != 0) {
        return {
            isValid : false,
            message:"Raw Files don't match the metadata!"
        }
    }

    return {
        isValid : true,
        message:""
    }
}

function checkMandatoryFields(json, basicInfo){
    let isValid=true;
    let jsonObj = JSON.parse(json);
    let emptyMandatoryFields = "";
    let mandatoryFields = ['FileName', 'genus', 'specificEpithet', 'Patch', 'LightAngle1', 'LightAngle2', 'ProbeAngle1', 'ProbeAngle2', 'Replicate']
    if (basicInfo.dataFrom === 'museum') {
        mandatoryFields = mandatoryFields.concat(['institutionCode', 'catalogueNumber']);
    }
    else if (basicInfo.dataFrom === 'field') {
        mandatoryFields = mandatoryFields.concat(['UniqueID']);
    }

    jsonObj.forEach(function(item, index) {
        mandatoryFields.forEach(function (item1, index1) {
            if (typeof (item[item1]) === 'undefined' || item[item1] === '') {
                isValid = false;
                emptyMandatoryFields += 'Row ' + (index + 1) + ': Attribute: ' + item1 + ', value: ' + item[item1] + ', FileName: ' + item['FileName'] + "\n";
            }
        });
    });

    return {
        isValid : isValid,
        message: isValid == false ? "Some mandatory fields are empty:\n" + emptyMandatoryFields : ""
    }
}

exports.validateSubmission = validateSubmission;