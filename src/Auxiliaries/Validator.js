const { fork } = require('child_process');
const common = require('../Auxiliaries/common.js')
const fs = require('fs');
var nodemailer = require('nodemailer');

function validateSubmission(req) {
    let rawFiles = req.files.raw;
    let metaFile = req.files.meta;

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
    let v2 = checkMandatoryFields(retVal.json);

    return{
        isValid: (v1.isValid & v2.isValid),
        message: v1.message+'\n'+v2.message
    } ;
}

function matchRawFilesAndMetadataFiles(rawFileNames, metadataRawFileNames) {
    rawFileNames.sort();
    metadataRawFileNames.sort();

   for(let i=0; i<rawFileNames.length ;i++){
        rawFileNames[i]= rawFileNames[i].substr(0,rawFileNames[i].length - 20)
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

function checkMandatoryFields(json){
    //should be in config
    let isValid=true;
    let mandatoryFields = ['FileName','catalogueNumber','genus','Patch','LightAngle1','LightAngle2','ProbeAngle1','ProbeAngle2','Replicate']
    let jsonObj = JSON.parse(json);
    let emptyMandatoryFields= [];

    jsonObj.forEach(myFunction);
    function myFunction(item, index) {
        mandatoryFields.forEach(myFunction2);

        function myFunction2(item1, index1) {
            if(item[item1] === '')
            {
                isValid = false;
                emptyMandatoryFields.push('field:\n Row: ',index+1,'| Attribute: ',item1+ ' value : '+item[item1]+'file'+ item['FileName'])
                // console.log('fields:\n Row: ',index+1,'| Attribute: ',item1+ ' value : '+item[item1]+'file'+ item['FileName']);
            }

        }
    }

    return {
        isValid : isValid,
        message:isValid==false?"Some mandatory fields are empty:\n"+emptyMandatoryFields:""
    }
}

//run().catch(err => console.error(err))*/



//exports.csvJSON = csvJSON;
exports.validateSubmission = validateSubmission;
exports.validate = validate;