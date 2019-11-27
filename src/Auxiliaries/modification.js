const common = require('../Auxiliaries/common.js');
const config = require('../config.json');
const db = require('../Auxiliaries/database');
var validator = require('../Auxiliaries/Validator')
var enums = require('../Auxiliaries/enums')
const dataCollectionName = config.db.dataCollection;

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

module.exports.modifySubmission = async function (submission, metaFile, rawFiles, session) {

    console.log("submission" + submission)
    console.log("metaFile" + metaFile)
    console.log("rawFiles" + rawFiles)
    console.log("session" + session)


  //  let submission = {"_id": "5ddc6a99ace6131b48225616", "path":"../data/userName/2019-10-25T20-28-14", "submitType":'museum'}
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
    let filesToBeRemoved =[]

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
       /* if( (metaItem["NewFileName"].length==0 && metaItem["FileName"].length>0) ||
            (metaItem["NewFileName"].length>0 && metaItem["FileName"].length>0))
        {
            filesToBeRemoved.push(metaItem["FileName"])
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
        let query = {$and:[{"filePath":"../data/userName/2019-10-25T20-28-14"},{FileName: { $in: filesToBeRemoved }} ] }
        await db.deleteMany(query, dataCollectionName)
        db.saveModifiedData(newMetadata, rawFiles, session.userInfo, submission)

        let fltr = { "_id": submission._id };
        let updt = { $set: { "processingStatus": enums.processingStatus.unprocessed } };

        await db.updateLocalPathInDb(fltr, updt);

        return {
            "success":1,
            message : "Modification succeeded!"
        }

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



