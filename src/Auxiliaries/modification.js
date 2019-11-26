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

module.exports.modifySubmission = function (req) {
    let rawFiles = req.files.raw;
    let metaFile = req.files.meta;
    let basicInfo = {"dataFrom": 'field'}//req.body; todo should be recieved from caller

    // todo should check if all new rawfiles are uploaded
    //todo replace submission with req.submission
    let submission = {"_id":"ddc6a99ace6131b48225616"}
    //------------------
    let ret = common.csvJSON(metaFile.data.toString());
    let metaJson = ret.json;
    let submittedModification;//{req.files.raw, req.files.meta,req.body }
    let newMetadata=[];
    let metaRawFilenames = ret.fileNames;
    // todo basicInfo

    premarilyValidation(metaJson,submission);

    //*****basicInfo.dataFrom
    metaJson.forEach(function (metaItem) {
        if((metaItem["NewFileName"].length>0 && metaItem["FileName"].length>0)//replace
        || (metaItem["NewFileName"].length>0 && metaItem["FileName"].length == 0))//add )
        {
            let normalMetaItem = metaItem;
            delete normalMetaItem["FileName"];
            newMetadata.push(normalMetaItem);//if it is new = old remove filename from ret.rawfilename
        }
        if(metaItem["NewFileName"] == metaItem["FileName"] )// todo use lowercase comparision
        {
            metaRawFilenames = metaRawFilenames.filter(v => v !== metaItem["FileName"]);//todo use lowercase comparision
        }
    })

    if(newMetadata.length>0)// we have add and replace
    {
        let validationStatus = validator.validateModificationSubmission(newMetadata, rawFiles,basicInfo,metaRawFilenames )
        if(!validationStatus.isValid)
            return {
            message : validationStatus.message
            }

            //todo delete replace recs
        db.saveData(newMetadata, req.files.raw, req.session.userInfo)
    }
}

async function premarilyValidation(metadata, submission){

    let newFileArr = []
    metadata.forEach(function (metaItem) {
        if(newFileArr.includes(metaItem["NewFileName"]))
            return false;
    })

    let query = {$and:[{"refId":submission._id},{FileName: { $in: newFileArr }} ] }

    let res  = await db.getMetadata(query)
    if(res.length >0 )
        return false;g
}

