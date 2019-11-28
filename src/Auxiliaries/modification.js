const common = require('../Auxiliaries/common.js');
const config = require('../config.json');
const db = require('../Auxiliaries/database');
var validator = require('../Auxiliaries/Validator')
var enums = require('../Auxiliaries/enums')
const fs = require('fs');
const dataCollectionName = config.db.dataCollection;

module.exports.modifySubmission = async function (submission, metaFile, rawFiles, session) {

    console.log("submission" + JSON.stringify(submission))
    console.log("metaFile" + JSON.stringify(metaFile))
    console.log("rawFiles" + JSON.stringify(rawFiles))
    console.log("session" + JSON.stringify(session))


  //  let submission = {"_id": "5ddc6a99ace6131b48225616", "path":"../data/userName/2019-10-25T20-28-14", "submitType":'museum'}
    //------------------
    let ret = common.csvJSON(metaFile.data.toString());
    let metaJson = ret.json;
    let newMetadata=[];

    let res = await preValidation(metaJson,submission)
    console.log("preValidation res: " + JSON.stringify(res))
    if(!res.success)
       return res;

    console.log("Pass preValidation")
    let filesToBeRemoved =[]

    metaJson.forEach(function (metaItem) {

        if( (metaItem["NewFileName"].length===0 && metaItem["FileName"].length>0) ||
            (metaItem["NewFileName"].length>0 && metaItem["FileName"].length>0))
        {
            filesToBeRemoved.push(metaItem["FileName"])
        }

        if((metaItem["NewFileName"].length>0 && metaItem["FileName"].length>0)//replace
            || (metaItem["NewFileName"].length>0 && metaItem["FileName"].length === 0))//add )
        {
            let normalMetaItem = metaItem;
            delete normalMetaItem["FileName"];
            normalMetaItem["FileName"] = normalMetaItem["NewFileName"];
            delete normalMetaItem["NewFileName"];

            newMetadata.push(normalMetaItem);
        }

    })

    console.log("newMetadata: " + JSON.stringify(newMetadata))
    let metaRawFilenames = [];
    newMetadata.forEach(function (meta) {
        metaRawFilenames.push(meta["FileName"]);
    })

    console.log("metaRawFilenames: " + JSON.stringify(metaRawFilenames))

    if(newMetadata.length>0)// we have add and replace
    {
        let validationStatus = validator.validateModificationSubmission(newMetadata, rawFiles, metaRawFilenames, submission)
        console.log("validateModificationSubmission" + JSON.stringify(validationStatus))
        if (!validationStatus.isValid)
            return {
                success: 0,
                message: validationStatus.message
            }
    }
    // ------------ delete ---------------
    console.log("filesToBeRemoved: "+filesToBeRemoved.toString())
    let query = {$and:[{"refId":submission._id},{FileName: { $in: filesToBeRemoved }} ] }//todo careful about
    console.log("del query" +query)
    await db.deleteMany(query, dataCollectionName)

    for (let i = 0; i< filesToBeRemoved.length; i++)
    {
        console.log("--- submission:" + JSON.stringify(submission))
        console.log("--- submission['path']:" + submission['path'])
        let filePath = submission['path']+"/"+ filesToBeRemoved[i] + config.rawFileExtension[0];
        fs.unlinkSync(filePath);
        console.log("** delete :" + filePath)
    }

    //--------------------------------

    if(newMetadata.length>0)// we have add and replace
    {
        db.saveModifiedData(newMetadata, rawFiles, session.userInfo, submission)

        let fltr = { "_id": submission._id };
        let updt = { $set: { "processingStatus": enums.processingStatus.unprocessed } };

        await db.updateLocalPathInDb(fltr, updt);

        return {
            success:1,
            message : "Modification succeeded!"
        }
    }
}

async function preValidation(metadata, submission){

    if((submission.submitType == 'museum'  && typeof (metadata[0]['institutionCode']) === 'undefined') ||
        (submission.submitType == 'field'  && typeof (metadata[0]['UniqueID']) === 'undefined')
    )
    {
        console.log(" field/museum")
        return {
            success:0,
            message : "Metadata does not match the type of chosen submission!"
        }
    }

    let newFileNameArr = []
    let oldFileNameArr = []

    let newFileNameArrTocheckInDb = []

    for(let i=0; i<metadata.length;i++){
        if(newFileNameArr.includes(metadata[i]["NewFileName"]))
        {
            return {
                success:0,
                message : "There are repeated occerence of files in newFileNames column!"
            }
        }

        if(oldFileNameArr.includes(metadata[i]["FileName"]))
        {
            return {
                success:0,
                message : "There are repeated occerence of files in FileNames column!"
            }
        }

        if(metadata[i]["NewFileName"].length > 0 )
            newFileNameArr.push(metadata[i]["NewFileName"])
        if(metadata[i]["FileName"].length > 0 )
            oldFileNameArr.push(metadata[i]["FileName"])
        if((metadata[i]["NewFileName"].length > 0 ) && (metadata[i]["NewFileName"] !== metadata[i]["FileName"] ))
            newFileNameArrTocheckInDb.push(metadata[i]["NewFileName"])

    }

    if(newFileNameArrTocheckInDb.length>0){
        let query = {$and:[{"refId":submission._id},{FileName: { $in: newFileNameArrTocheckInDb }} ] }
        let res  = await db.getMeta(query)
        console.log("newFileNameArrTocheckInDb res : " + JSON.stringify(res))
        console.log("new file: " + newFileNameArrTocheckInDb)
        if(res.length >0 )
            return {
                success:0,
                message : "New filenames already exist in the system!"
            }
    }

   if(oldFileNameArr.length > 0){
       let q = {$and:[{"refId":submission._id},{FileName: { $in: oldFileNameArr }} ] }
       let result  = await db.getMeta(q)
       console.log("old file: " + oldFileNameArr)
       console.log("oldFileNameArr res : " + JSON.stringify(result))
       if(result.length !== oldFileNameArr.length )
           return {
               success:0,
               message : "some of FileNames do not exist in the system!"
           }
   }
    return {
        success:1,
        message : "Ok!"
    }

}



