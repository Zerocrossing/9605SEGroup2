
function checkMandatoryFields(json){
    //should be in config
    let mandatoryFields = ['FileName','catalogueNumber','genus','Patch','LightAngle1','LightAngle2','ProbeAngle1','ProbeAngle2','Replicate']
    let jsonObj = JSON.parse(json);

    jsonObj.forEach(myFunction);
    function myFunction(item, index) {
        // console.log(item, index);
        mandatoryFields.forEach(myFunction2);

        function myFunction2(item1, index1) {
            // console.log(item[item1],item1);
            if(item[item1] === '')
                console.log('fields:\n Row: ',index+1,'| Attribute: ',item1);
        }
    }



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
function validateUploadedFiles(files){


    let rawFileNames =[]
    let retVal;
    let csvFileNo = 0;
   // let files = req.files;
    //csv and Transmission should be in config
    // just one csv file is allowed, all the others should be rawfile
    for (let i = 0; i < files.length; i++){
        let splittedName = files[i].name.split(".");
        var ext = splittedName[splittedName.length-1];

        if(ext === 'csv'){

            csvFileNo++;
            if(csvFileNo>1)
            {
                console.log("You are allowed to submit just one metadata file in each upload!");
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
            //Stop and show error message to the user
        }
    }

    let isMatch = matchRawFilesAndMetadataFiles(rawFileNames,retVal.fileNames)
    let emptyMandatoryFields = checkMandatoryFields(retVal.json)


}

exports.csvJSON = csvJSON;
exports.validateUploadedFiles = validateUploadedFiles;
