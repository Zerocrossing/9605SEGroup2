const { fork } = require('child_process');
// const { Worker } = require('worker_threads')
const fs = require('fs');
var nodemailer = require('nodemailer');

function validateSubmission(req) {
    let rawFiles = req.files.raw;
    let metaFile = req.files.meta;

    let rawFileNames = [];
    let retVal = csvJSON(metaFile.data.toString());

    for (let i = 0; i < rawFiles.length; i++) {
        rawFileNames.push(rawFiles[i].name);
    }

    let v1 = matchRawFilesAndMetadataFiles(rawFileNames, retVal.fileNames);
    let v2 = checkMandatoryFields(retVal.json);

    // Second validation should take place after first has been sent back
    validate(rawFiles);

    return (v1 && v2);
}

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
        //emptyMandatoryFields:
    };
    //return JSON.stringify(result); //JSON
}

function matchRawFilesAndMetadataFiles(rawFileNames, metadataRawFileNames) {
    rawFileNames.sort();
    metadataRawFileNames.sort();

    let rawFileNamesStr = rawFileNames.toString();
    let metadataRawFileNamesStr = metadataRawFileNames.toString();

    if (!rawFileNamesStr.toLowerCase().localeCompare(metadataRawFileNamesStr.toLowerCase()))
        return false;
    return true;
}

function checkMandatoryFields(json){
    //should be in config
    let isValid=true;
    let mandatoryFields = ['FileName','catalogueNumber','genus','Patch','LightAngle1','LightAngle2','ProbeAngle1','ProbeAngle2','Replicate']
    let jsonObj = JSON.parse(json);

    jsonObj.forEach(myFunction);
    function myFunction(item, index) {
        mandatoryFields.forEach(myFunction2);

        function myFunction2(item1, index1) {
            if(item[item1] === '')
            {
                isValid = false;
                console.log('fields:\n Row: ',index+1,'| Attribute: ',item1+ ' value : '+item[item1]+'file'+ item['FileName']);
            }

        }
    }

    return isValid;
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
        console.log("Files With Small Negative Value"+message.returnValue.filesWithSmallNegative)
        console.log("Files With Large Negative Value"+message.returnValue.filesWithLargeNegative)
        console.log("Number of files processed : "+message.returnValue.count)


        let filesWithSmallNegative_Formatted = message.returnValue.filesWithSmallNegative.join('\n');
        let filesWithLargeNegative_Formatted = message.returnValue.filesWithLargeNegative.join('\n');

        fs.appendFile('Report_FilesWithSmallNegative.csv', filesWithSmallNegative_Formatted, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
        fs.appendFile('Report_FilesWithLargeNegative.csv', filesWithLargeNegative_Formatted, function (err) {
            if (err) throw err;
            console.log('Saved!');
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



exports.csvJSON = csvJSON;
exports.validateSubmission = validateSubmission;
exports.validate = validate;