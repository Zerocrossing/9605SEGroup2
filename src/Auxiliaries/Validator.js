const { fork } = require('child_process');
const common = require('../Auxiliaries/common.js')
const fs = require('fs');
const jszip = require('jszip');
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

function validate(rawFiles){
    // fork another process
    const process = fork('./Auxiliaries/rawFilesValidator.js');
    //add new attribute to rawFiles
    for (let i = 0; i < rawFiles.length; i++){
        rawFiles[i]["strContent"] = rawFiles[i].data.toString();
    }

    process.send( {rawFiles});
    // listen for messages from forked process
    process.on('message', (message) => {

       // console.log(`Number of files processed ${message.counter}`);
       //  console.log("Files With Small Negative Value"+message.returnValue.filesWithSmallNegative)
       //  console.log("Files With Large Negative Value"+message.returnValue.filesWithLargeNegative)
       //  console.log("Number of files processed : "+message.returnValue.count)


        let filesWithSmallNegative_Formatted = message.returnValue.filesWithSmallNegative.join('\n');
        let filesWithLargeNegative_Formatted = message.returnValue.filesWithLargeNegative.join('\n');

        fs.appendFile('Report_FilesWithSmallNegative.csv', filesWithSmallNegative_Formatted, function (err) {
            if (err) throw err;
            // console.log('Saved!');
        });
        fs.appendFile('Report_FilesWithLargeNegative.csv', filesWithLargeNegative_Formatted, function (err) {
            if (err) throw err;
            // console.log('Saved!');
        });

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'g2software2019@gmail.com',
                pass: 'Gg@123456'
            }
        });

        var mailOptions = {
            from: 'g2sogtware2019@gmail.com',
            to: 'pasargad63@yahoo.com',
            subject: 'File Validation Report',
            text: 'Please see the attached files concerning your last submission on nature palette!',
            attachments: [
                {
                    filename: 'Report_FilesWithSmallNegative.csv',
                    path: './Report_FilesWithSmallNegative.csv'
                },
                {
                    filename: 'Report_FilesWithLargeNegative.csv',
                    path: './Report_FilesWithLargeNegative.csv'
                }
            ]

        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
                fs.access('./Report_FilesWithLargeNegative.csv',error=>{
                    if(!error){
                        fs.unlink('./Report_FilesWithLargeNegative.csv',function (error) {
                            console.log(error)
                            
                        });
                    }else{
                        console.log(error);
                    }
                });

                fs.access('./Report_FilesWithSmallNegative.csv',error=>{
                    if(!error){
                        fs.unlink('./Report_FilesWithSmallNegative.csv',function (error) {
                            console.log(error)

                        });
                    }else{
                        console.log(error);
                    }
                });
            }
        });
    });
   // return response.json({ status: true, sent: true });
}



//run().catch(err => console.error(err))*/



//exports.csvJSON = csvJSON;
exports.validateSubmission = validateSubmission;
exports.validate = validate;