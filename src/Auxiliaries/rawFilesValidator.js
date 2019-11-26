const db = require('../Auxiliaries/database');
const enums = require('../Auxiliaries/enums.js');
const config = require('../config.json');
const fs = require('fs');
var nodemailer = require('nodemailer');

async function processRawFiles(){

    try {

        let query = { "processingStatus": enums.processingStatus.unprocessed };

        let localPaths = await db.getLocalPathFromDb(query, false);
        if(typeof (localPaths) === 'undefined')
        {
            console.log("localpath undefined!");
            return;
        }
        let localPathsArr = Object.values(localPaths);

        for(let i=0 ; i< localPathsArr.length ; i++) {
            // console.log(localPath)
            let filter = { $and: [{ "path": localPathsArr[i].path }, { "processingStatus": enums.processingStatus.unprocessed }] };
            let update = { $set: { "processingStatus": enums.processingStatus.inProgress } };

            await db.updateLocalPathInDb(filter, update);

            try {
                let retVal = validateRawFiles(localPathsArr[i]);

                let fltr = { $and: [{ "path": localPathsArr[i].path }, { "processingStatus": enums.processingStatus.inProgress }] };
                let updt = { $set: { "processingStatus": enums.processingStatus.processed } };

                await db.updateLocalPathInDb(fltr, updt);


                if (retVal.filesWithLargeNegative.length > 0)
                    await updateMetadata(localPathsArr[i], retVal.filesWithLargeNegative);
                if (retVal.filesWithSmallNegative.length > 0 || retVal.filesWithLargeNegative.length > 0)
                    sendEmail(retVal.filesWithSmallNegative, retVal.filesWithLargeNegative);

            } catch (e) { //rollback!
                let f = { $and: [{ "path": localPathsArr[i].path }] };
                let u = { $set: { "processingStatus": enums.processingStatus.unprocessed } };
                console.log("Error happened during validation of rawfiles for path:" + localPathsArr[i].path);
                await db.updateLocalPathInDb(f, u);
                throw(e);
            }

        }
      //  })
    }
    catch (e) {
        console.log("error : " + e.message);
    }


}
async function updateMetadata(localPath, filesWithLargeNegative) {

    fwl = [];
    filesWithLargeNegative.forEach(function (elem) {
        fwl.push(elem.substr(0, elem.length - config.rawFileExtension[0].length));
    })
    //________update metadata with invalid rawfile
    let filter = { $and: [{ "refId": localPath._id }, { FileName: { $in: fwl } }] };
    let update = { $set: { "validationStatus": enums.validationStatus.invalid } };

    let ret = await db.updateMetadate(filter, update);

//________update metadata with valid rawfile
    let f = { $and: [{ "refId": localPath._id }, { FileName: { $nin: fwl } }] };
    let u = { $set: { "validationStatus": enums.validationStatus.valid } };

    let retval = await db.updateMetadate(f, u);

    let res = await db.getMetadata(f);

    console.log("I am here (1)"+ JSON.stringify(retval));
}

function sendEmail(filesWithSmallNegative,filesWithLargeNegative) {

    let filesWithSmallNegative_Formatted = filesWithSmallNegative.join('\n');
    let filesWithLargeNegative_Formatted = filesWithLargeNegative.join('\n');
    let attachment = []

    if(filesWithSmallNegative.length>0)
    {
        fs.appendFile('Report_FilesWithSmallNegative.csv', filesWithSmallNegative_Formatted, function (err) {
        if (err) throw err;
    });
        attachment.push( {
            filename: 'Report_FilesWithSmallNegative.csv',
            path: './Report_FilesWithSmallNegative.csv'
        })

    }

    if(filesWithLargeNegative.length>0)
    {
        fs.appendFile('Report_FilesWithLargeNegative.csv', filesWithLargeNegative_Formatted, function (err) {
            if (err) throw err;
        });

        attachment.push( {
            filename: 'Report_FilesWithLargeNegative.csv',
            path: './Report_FilesWithLargeNegative.csv'
        })
    }

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
        attachments: attachment
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


}

function validateRawFiles(pathRec){

    let filesWithSmallNegative=[]
    let filesWithLargeNegative=[]


    let path = require('path');
    let fs = require('fs');

    let directoryPath = pathRec.path
    // console.log(directoryPath)
    let getDirectories = fs.readdirSync(directoryPath)
        .map(file => path.join(directoryPath, file))
        .filter(path => fs.statSync(path).isDirectory());


    let srchDir = []
    let count = 0
    srchDir.push(directoryPath);
    srchDir = srchDir.concat(getDirectories)
    // console.log(srchDir);
    srchDir.forEach(function (dir) {
        fs.readdirSync(dir).forEach(function (file) {

            var fs = require('fs');

            // todo replace rawFileExtensionLength
            if (file.substr(file.length - config.rawFileExtension[0].length) === config.rawFileExtension[0]) {
                count++
                var buffer = fs.readFileSync(dir + "\\" + file);

                let retVal = validateSingleFile(file, buffer.toString())
                // console.log(retVal)
                if (retVal.hasSmallNegative)
                    filesWithSmallNegative.push(file)
                if (retVal.hasLargeNegative)
                    filesWithLargeNegative.push(file)
            }
        });
    });


    return {
        filesWithSmallNegative:filesWithSmallNegative,
        filesWithLargeNegative:filesWithLargeNegative
    }

}
function validateSingleFile(fileName,content){

    let hasSmallNegative = false;
    let hasLargeNegative = false;

    let lines=content.split("\r\n");
    let startIndexOfSpectral = 0

    while(!lines[startIndexOfSpectral].includes('>>>>>Begin'))
    {
        startIndexOfSpectral++;
    }
    for(let i=startIndexOfSpectral+1;i<lines.length;i++){

        if(lines[i].includes('>>>>>End'))
            break;

        let splitted = lines[i].split('\t');
        let x = parseFloat(splitted[0]);
        let y= parseFloat(splitted[1])

        let line = i+1;
        if(x<-2 || y <-2)
        {
            // console.log("value < -2")
            // console.log(fileName+' Line:'+ line + ' value: '+x +'-'+y)
            hasLargeNegative=true;
        }

        if((-2<x && x<0) || (-2<y && y<0))
        {
            // console.log("value between 0 and -2")
            // console.log(fileName+' Line: '+ line + ' value: '+x+'-'+y)
            hasSmallNegative=true;
        }
    }

    return{
        hasLargeNegative:hasLargeNegative,
        hasSmallNegative:hasSmallNegative
    }
}
exports.processRawFiles = processRawFiles;
