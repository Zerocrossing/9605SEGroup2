/*async function validate(rawFiles){
    setTimeout(validate1, 10000,rawFiles)
    return 11;

}*/
async function validate(rawFiles) {
    let rawFilesArray= Object.values(rawFiles)
    let retVal;
    let filesWithSmallNegative=[]
    let filesWithLargeNegative=[]
    for (let i = 0; i < rawFilesArray.length; i++){
        retVal = validateSingleFile(rawFilesArray[i].name,rawFilesArray[i].strContent);
        if(retVal.hasSmallNegative)
            filesWithSmallNegative.push(rawFilesArray[i].name)
        if(retVal.hasLargeNegative)
            filesWithLargeNegative.push(rawFilesArray[i].name)

    }
   /* console.log("filesWithSmallNegative:",filesWithSmallNegative)
    console.log("filesWithSmallNegative count:",filesWithSmallNegative.length)
    console.log("filesWithLargeNegative:",filesWithLargeNegative)
    console.log("filesWithLargeNegative count:",filesWithLargeNegative.length)
   */ //return rawFilesArray.length
    return{
        filesWithSmallNegative:filesWithSmallNegative,
        filesWithLargeNegative:filesWithLargeNegative,
        count:rawFilesArray.length
    }

}
function validateSingleFile(fileName,content){
    let hasSmallNegative = false;
    let hasLargeNegative = false;

    let lines=content.split("\r\n");
    // console.log("inside check")

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

    //
}


// receive message from master process
process.on('message', async (message) => {
    const retVal = await validate(message.rawFiles);

    // send response to master process
    //console.log("before send")
    process.send({ returnValue: retVal });
});