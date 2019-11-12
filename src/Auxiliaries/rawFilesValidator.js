const db = require('../Auxiliaries/database');
const enums = require('../Auxiliaries/enums.js');
const config = require('../config.json');
const fs = require('fs');
var nodemailer = require('nodemailer');

async function processRawFiles(){
   // let query = "{"+"\"processingStatus\""+ ":"+ enums.processingStatus.unprocessed+"}"
    let query = {"processingStatus": enums.processingStatus.unprocessed}
    //console.log(query)
    let localPaths = await db.getLocalPathFromDb(query)
    let localPathsArr = Object.values(localPaths)

    console.log("localPathsArr.length: " + localPathsArr.length)

    localPathsArr.forEach(function (localPath) {
       // console.log(localPath)
        let retVal = validateRawFiles(localPath)
        sendEmail(retVal.filesWithSmallNegative, retVal.filesWithLargeNegative)

    })

}

function sendEmail(filesWithSmallNegative,filesWithLargeNegative) {

    let filesWithSmallNegative_Formatted = filesWithSmallNegative.join('\n');
    let filesWithLargeNegative_Formatted = filesWithLargeNegative.join('\n');

    fs.appendFile('Report_FilesWithSmallNegative.csv', filesWithSmallNegative_Formatted, function (err) {
        if (err) throw err;
    });
    fs.appendFile('Report_FilesWithLargeNegative.csv', filesWithLargeNegative_Formatted, function (err) {
        if (err) throw err;
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


}

function validateRawFiles(pathRec){

    let filter = {$and:[{"path":pathRec.path}, {"processingStatus": enums.processingStatus.unprocessed}] }
    let update = {$set:{"processingStatus":enums.processingStatus.inProgress}}

    db.updateLocalPathInDb(filter, update)

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

            if (file.substr(file.length - config.rawFileExtensionLength) === config.rawFileExtension) {
                count++
                var buffer = fs.readFileSync(dir + "\\" + file);

                let retVal = validateSingleFile(file, buffer.toString())
              //  console.log(retVal)
                if (retVal.hasSmallNegative)
                    filesWithSmallNegative.push(file)
                if (retVal.hasLargeNegative)
                    filesWithLargeNegative.push(file)
            }
        });
    });

    //console.log("filesWithSmallNegative" + filesWithSmallNegative);
    //console.log("filesWithLargeNegative" + filesWithLargeNegative);
    //console.log("count"+ count)

    let fltr = {$and:[{"path":pathRec.path},{"processingStatus": enums.processingStatus.inProgress}]}
    let updt = {$set:{"processingStatus":enums.processingStatus.processed}}

    db.updateLocalPathInDb(fltr, updt)

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
