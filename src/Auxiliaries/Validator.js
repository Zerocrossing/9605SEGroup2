const { fork } = require('child_process');
// const { Worker } = require('worker_threads')
const fs = require('fs');
var nodemailer = require('nodemailer');

function checkMandatoryFields(json){
    //should be in config
    let isValid=true;
    let mandatoryFields = ['FileName','catalogueNumber','genus','Patch','LightAngle1','LightAngle2','ProbeAngle1','ProbeAngle2','Replicate']
    let jsonObj = JSON.parse(json);
    console.log(jsonObj)

    jsonObj.forEach(myFunction);
    function myFunction(item, index) {
        // console.log(item, index);
        mandatoryFields.forEach(myFunction2);

        function myFunction2(item1, index1) {
            // console.log(item[item1],item1);
            if(item[item1] === '')
            {
                isValid = false;
                console.log('fields:\n Row: ',index+1,'| Attribute: ',item1+ ' value : '+item[item1]+'file'+ item['FileName']);
            }

        }
    }

    return isValid;

}
function matchRawFilesAndMetadataFiles (rawFileNames,metadataRawFileNames){
    rawFileNames.sort();
    metadataRawFileNames.sort();

    let rawFileNamesStr = rawFileNames.toString();
    let metadataRawFileNamesStr = metadataRawFileNames.toString();

    if(!rawFileNamesStr.toLowerCase().localeCompare(metadataRawFileNamesStr.toLowerCase()))
        return false;
    return true;

}
function csvJSON(csv){

    var lines=csv.split("\r\n");

    var result = [];
    var fileNamesArr = [];

    var headers=lines[0].split(",");

    for(var i=1;i<lines.length;i++){

        var obj = {};
        var currentline=lines[i].split(",");

        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
            if(j==0 && currentline[0]!='' )
            {
                fileNamesArr.push(currentline[0])
            }
        }
        if(typeof (obj['institutionCode']) !== 'undefined')
            result.push(obj);
    }

    //return result; //JavaScript object
    return {
        json: JSON.stringify(result),
        fileNames:fileNamesArr ,
        //emptyMandatoryFields:
    };
    //return JSON.stringify(result); //JSON
}
function validateEmbargo(embargo,embargoDate){
   // let selectedRadioBtn= req.body.radio;


   // if(embargo == 'yes')
   // {
        //let d= req.body.date;
        if(embargoDate=="") {
            console.log("Please enter the date!")
            return false;
        }

        let date =  embargoDate.split('-');
        let formattedDate = date[0]+'/'+date[1]+'/'+date[2];
        let dateObj=new Date(formattedDate);

        var today = new Date();
        let todayYear =today.getFullYear();
        let todayMonth =today.getMonth()+1;
        let todayDate =today.getDate();

        let oneYearLater = new Date(todayYear+1+'/'+todayMonth+'/'+todayDate);

        if(dateObj >oneYearLater ) {
            console.log("Embargo Error!");
            return false;
        }

        return true;

   // }

}
function validateUploadedFiles(files) {

    let rawFileNames =[]
    let rawFiles =[]
    let retVal;
    let csvFileNo = 0;
    // let files = req.files;
    //csv and Transmission should be in config
    // just one csv file is allowed, all the others should be rawfile
    //Temporary Validation-----------
    if(typeof files.length === 'undefined')
    {
        console.log("Wrong number of file!")
        return false;
    }
    //-------------------------------
    for (let i = 0; i < files.length; i++){
        let splittedName = files[i].name.split(".");
        var ext = splittedName[splittedName.length-1];

        if(ext === 'csv'){

            csvFileNo++;
            if(csvFileNo>1)
            {
                console.log("You are allowed to submit just one metadata file in each upload!");
                return false;
                //Stop and show error message to the user
            }
            let content  = files[i].data.toString();
            retVal = csvJSON(content);


        } else if (ext ==='Transmission')
        {
            rawFileNames.push(splittedName[0]+splittedName[1])
            rawFiles.push(files[i]);
        }
        else
        {
            console.log("There are invalid type of file in the submission!")
            return false;
            //Stop and show error message to the user
        }
    }

    let v1 = matchRawFilesAndMetadataFiles(rawFileNames,retVal.fileNames)
    let v2 = checkMandatoryFields(retVal.json)
   // console.log(rawFiles)
    /*for (let i = 0; i < rawFiles.length; i++){
        let content  = rawFiles[i].data.toString();
        console.log(content)
        let v3 = check1(content);
    }*/
   // console.log("---)))------",typeof rawFiles)
    validate(rawFiles)
    return v1&v2
    
}
function validateSubmission(req){
    let v1=true;
    let v2 =true;
    if(req.body.radio == 'yes')
        v1 = validateEmbargo(req.body.radio, req.body.date)
    v2 = validateUploadedFiles(req.files.uploaded);
    return v1&v2;
    /*return (validateEmbargo(req.body.radio, req.body.date)
        &&validateUploadedFiles(req.files.uploaded));*/
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
