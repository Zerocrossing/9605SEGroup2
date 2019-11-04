// --------------samira
exports.checkMandatoryFields =function(json){
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
exports.matchRawFilesAndMetadataFiles= function (rawFileNames,metadataRawFileNames){
    rawFileNames.sort();
    metadataRawFileNames.sort();

    let rawFileNamesStr = rawFileNames.toString();
    let metadataRawFileNamesStr = metadataRawFileNames.toString();

    if(!rawFileNamesStr.toLowerCase().localeCompare(metadataRawFileNamesStr.toLowerCase()))
        return false;
    return true;

}
exports.csvJSON = function (csv){
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