const common = require('../Auxiliaries/common.js');
const config = require('../config.json');
const db = require('../Auxiliaries/database');
var validator = require('../Auxiliaries/Validator')

module.exports.modifySubmission_v1 = function (req) {

    // todo should check if all new rawfiles are uploaded
    //todo replace submission with req.submission
    let submission = {"_id":"ddc6a99ace6131b48225616"}
    //------------------
    let ret = common.csvJSON(req.meta.data.toString());
    let metaJson = ret.json;
    metaJson.forEach(function (metaItem) {
        if(metaItem["NewFileName"].length>0 && metaItem["FileName"].length>0 )
        {
            //replace
            replace(metaItem, submission);
        }
        else if(metaItem["NewFileName"].length>0 && metaItem["FileName"].length == 0 )
        {
            //add
        }
        else if(metaItem["NewFileName"].length == 0 && metaItem["FileName"].length > 0 )
        {
            //delete
        }
    })

}

module.exports.modifySubmission = async function (req) {


    let rawFiles = req.files.raw;
    let metaFile = req.files.meta;


    //todo replace submission with req.submission
    let submission = {"_id": "5ddc6a99ace6131b48225616", "path":"../data/userName/2019-10-25T20-28-14", "submitType":'museum'}
    //------------------
    let ret = common.csvJSON(metaFile.data.toString());
    let metaJson = ret.json;
   // let submittedModification;//{req.files.raw, req.files.meta,req.body }
    let newMetadata=[];
   // let metaRawFilenames = ret.fileNames;

    //console.log("metaJson "+ metaJson);
    //console.log("rawFiles: "+ JSON.stringify(rawFiles))
   // console.log("metaRawFilenames" + metaRawFilenames);

    let res = await preValidation(metaJson,submission)
    console.log("res: " + res)
    if(!res)
        return {
        "success":0,
        "message":"Error in modification: \n repeated new file's names Or existance of new file's names in the system "
        }

    console.log("Pass preValidation")

    //*****basicInfo.dataFrom
    metaJson.forEach(function (metaItem) {
        if((metaItem["NewFileName"].length>0 && metaItem["FileName"].length>0)//replace
            || (metaItem["NewFileName"].length>0 && metaItem["FileName"].length == 0))//add )
        {
            let normalMetaItem = metaItem;
            delete normalMetaItem["FileName"];
            normalMetaItem["FileName"] = normalMetaItem["NewFileName"];
            delete normalMetaItem["NewFileName"];

            newMetadata.push(normalMetaItem);//if it is new = old remove filename from ret.rawfilename
        }
       /* if(metaItem["NewFileName"] == metaItem["FileName"] )// todo use lowercase comparision
        {
            metaRawFilenames = metaRawFilenames.filter(v => v !== metaItem["FileName"]);//todo use lowercase comparision
        }*/
    })

    console.log("newMetadata: " + JSON.stringify(newMetadata))
    let metaRawFilenames = [];
    newMetadata.forEach(function (meta) {
        metaRawFilenames.push(meta["FileName"]);
    })

    console.log("metaRawFilenames: " + JSON.stringify(metaRawFilenames))

    if(newMetadata.length>0)// we have add and replace
    {
        let validationStatus = validator.validateModificationSubmission(newMetadata, rawFiles,metaRawFilenames,submission )
        if(!validationStatus.isValid)
            return {
                "success":0,
                message : validationStatus.message
            }

        //todo delete replace recs
        db.saveModifiedData(newMetadata, req.files.raw, req.session.userInfo, submission)
    }
}

async function preValidation(metadata, submission){

    let newFileNameArr = []
    let oldFileNameArr = []
  //  metadata.forEach(function (metaItem) {
    for(let i=0; i<metadata.length;i++){
        if(newFileNameArr.includes(metadata[i]["NewFileName"]))
        { console.log("icnlude" + metadata[i]["NewFileName"])
            return false;}
        if(metadata[i]["NewFileName"].length > 0 )
            newFileNameArr.push(metadata[i]["NewFileName"])
        if(metadata[i]["FileName"].length > 0 )
            oldFileNameArr.push(metadata[i]["FileName"])
    }

    console.log("newFileNameArr:" + newFileNameArr)
    console.log("oldFileNameArr:" + oldFileNameArr)



   // let query = {$and:[{"refId":submission._id},{FileName: { $in: newFileNameArr }} ] }
    let query = {$and:[{"filePath":"../data/userName/2019-10-25T20-28-14"},{FileName: { $in: newFileNameArr }} ] }

    console.log("query:" + query)

    let res  = await db.getMeta(query)

    console.log("res:" + res.length)

    if(res.length >0 )
        return false;

    return true;

}



