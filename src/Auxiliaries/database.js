const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const enums = require('../Auxiliaries/enums.js');
const url = config.db.url;
const dbName = config.db.dbName;
const dataCollectionName = config.db.dataCollection;
const userCollectionName = config.db.userCollection;
const rawFilesCollection = config.db.rawFilesCollection;
const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});
const common = require('../Auxiliaries/common.js');
client.connect(function (err, db) {
    if (!err) {
        console.log("Connected to database");
    } else {
        console.log("ERROR CONNECTING TO DATABASE: ", err);
    }
});


module.exports.saveData = function (metaObject, fileObject) {
    saveObjectToDb(metaObject, dataCollectionName);
    saveFileToLocal(fileObject);
    saveRawFilesSpecs(fileObject);
};
//save raw files specs to the database
function saveRawFilesSpecs(fileObjects){
    if (typeof fileObjects.length === 'undefined') {
        fileObjects = [fileObjects];
    }
    console.log(fileObjects)
    let rawFileRecords = []
    fileObjects.forEach(function (fileObj) {
        let splitExt = fileObj.name.split(".");
        let ext = splitExt[splitExt.length - 1];
        if (ext === 'csv') {
            return;
        }

        if (ext === 'zip'){
            let res = common.getZippedFileNames(fileObj)
           // console.log(res.rawFileNames)
            res.rawFileNames.forEach(function (fileName){
                let rawFileRec={};
                rawFileRec["RawFileName"]=fileName;//(splitExt.slice(0,splitExt.length - 2)).join(".")
                rawFileRec["processingStatus"]=enums.processingStatus.unprocessed;
                rawFileRec["validationStatus"]=enums.validationStatus.unknown;

                rawFileRecords.push(rawFileRec);

            });
        }
        else {
            let rawFileRecord = {};
            rawFileRecord["RawFileName"] = fileObj.name;//(splitExt.slice(0,splitExt.length - 2)).join(".")
            rawFileRecord["processingStatus"] = enums.processingStatus.unprocessed;
            rawFileRecord["validationStatus"] = enums.validationStatus.unknown;

            rawFileRecords.push(rawFileRecord);
        }

    });
    console.log(rawFileRecords);
    saveObjectToDb(rawFileRecords, rawFilesCollection);
}

// save collection
function saveObjectToDb(objectTobeSaved, collectionName) {
    let documents;
    documents = objectTobeSaved;
    let dataCollection = client.db(dbName).collection(collectionName);
    dataCollection.insertMany(documents, function (err, res) {
        if (err) throw err;
        if (config.debug) {
            console.log("Items added to db collection :"+ collectionName);
        }
    });
}
// saves the metadata to the database
/*function saveMetaToDatabase(metaObject) {
    let documents;
    documents = metaObject;
    let dataCollection = client.db(dbName).collection(dataCollectionName);
    dataCollection.insertMany(documents, function (err, res) {
        if (err) throw err;
        if (config.debug) {
            console.log("Items added to DB");
        }
    });
}*/

// saves the raw data files to the directory given in config.dataFilePath, excluding .csv files
function saveFileToLocal(fileObjects) {
    if (typeof fileObjects.length === 'undefined') {
        fileObjects = [fileObjects];
    }
    fileObjects.forEach(function (fileObj) {
        let splitExt = fileObj.name.split(".");
        let ext = splitExt[splitExt.length - 1];
        if (ext === 'csv') {
            return;
        }

        if (ext === 'zip') {
            common.extractZippedFile(fileObj,config.dataFilePath);
        }
        else
            fileObj.mv(config.dataFilePath + "/" + fileObj.name);
    });
    if (config.debug) {
        console.log("Items stored on disk");
    }
}

// takes in the raw post request and returns an array of data objects from the database
module.exports.getQueryResults = function (query) {
    query = parseQuery(query);
    results = getResultsFromDB(query);
    return results;
};

function parseQuery(query) {
    //todo logic
    return {}; //todo right now this always returns en empty query, which returns the whole DB
}

async function getResultsFromDB(query) {
    //todo logic
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    let collection = db.collection(dataCollectionName);
    let result = await collection.find(query).toArray();
    return result;
}