
function checkMandatoryFields(json){
    //should be in config
    let isValid=true;
    let mandatoryFields = ['FileName','catalogueNumber','genus','Patch','LightAngle1','LightAngle2','ProbeAngle1','ProbeAngle2','Replicate']
    let jsonObj = JSON.parse(json);

    jsonObj.forEach(myFunction);
    function myFunction(item, index) {
        // console.log(item, index);
        mandatoryFields.forEach(myFunction2);

        function myFunction2(item1, index1) {
            // console.log(item[item1],item1);
            if(item[item1] === '')
            {
                isValid = false;
                console.log('fields:\n Row: ',index+1,'| Attribute: ',item1);
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
    //let requiredField=['FileName','','','','','','']
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

exports.csvJSON = csvJSON;
exports.validateSubmission = validateSubmission;
