const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const enums = require('../Auxiliaries/enums.js');
const url = config.db.url;
const dbName = config.db.dbName;
const dataCollectionName = config.db.dataCollection;
const userCollectionName = config.db.userCollection;
const submission = config.db.submission;
const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});
const common = require('../Auxiliaries/common.js')
var fs = require('fs');
client.connect(function (err, db) {
    if (!err) {
        console.log("Connected to database");
    } else {
        console.log("ERROR CONNECTING TO DATABASE: ", err);
    }
});


module.exports.saveData = function (metaObject, fileObject) {
  //  saveObjectToDb(metaObject, dataCollectionName);

    let pathToSave = getLocalPath()
    saveFileToLocal(fileObject, pathToSave);
    saveDataToDb(metaObject, pathToSave);
};

function getLocalPath()
{
    let currentDateTime = new Date();
    let formattedCurrentDateTime = currentDateTime.getFullYear()+"-"+ currentDateTime.getMonth()+"-"+ currentDateTime.getDate()
        +"T"+currentDateTime.getHours()+"-"+currentDateTime.getMinutes()+"-"+currentDateTime.getSeconds()
    console.log(formattedCurrentDateTime)
    let pathToSave = config.dataFilePath + "/" + config.tempUser.userName+"/" + formattedCurrentDateTime;
    console.log(pathToSave)
    return pathToSave;
}

async function saveDataToDb(metaObject, pathToSave) {
    let rec = {}

    rec["path"] = pathToSave
    rec["processingStatus"] = enums.processingStatus.unprocessed;

    let res = await saveSingleObjectToDb(rec, submission);
    console.log(JSON.stringify(res));

    let metaTobeSaved = []
    metaObject.forEach(function (elem) {
        elem["refId"] = res.ops[0]._id;
        elem["validationStatus"] = enums.validationStatus.unknown
        metaTobeSaved.push(elem);
    })

    saveObjectToDb(metaTobeSaved, dataCollectionName);
}

// saves the raw data files to the directory given in config.dataFilePath, excluding .csv files
function saveFileToLocal(fileObjects, pathToSave) {
    if (typeof fileObjects.length === 'undefined') {
        fileObjects = [fileObjects];
    }

   if (!fs.existsSync(pathToSave)) {
        fs.mkdirSync(pathToSave,{ recursive: true });
    }
    fileObjects.forEach(function (fileObj) {
        let splitExt = fileObj.name.split(".");
        let ext = splitExt[splitExt.length - 1];
        if (ext === 'csv') {
            return;
        }

        if (ext === 'zip') {
            common.extractZippedFile(fileObj, pathToSave);
        } else
            fileObj.mv(pathToSave + "/" + fileObj.name);
    });
    if (config.debug) {
        console.log("Items stored on disk");
    }
}

// takes in the raw post request and returns an array of data objects from the database
module.exports.getQueryResults = function (query) {
    let parsedQuery = parseQuery(query);
    let options = getOptions(query);

    results = getResultsFromDB(parsedQuery, dataCollectionName, options);
    return results;
};

module.exports.getMetadata = function (query) {

    let options = getOptions(query);

    results = getResultsFromDB(query, dataCollectionName, options);
    return results;
};

//takes in the raw post request and returns the size of the query (for pagination)
module.exports.getQuerySize = function (query) {
    let parsedQuery = parseQuery(query);
    let count = getQuerySize(parsedQuery, dataCollectionName);
    return count;
};

//This function takes in the querystring from the page form and returns a mongo-appropriate query
function parseQuery(query) {
    parsed = {};
    //Only accept search terms defined in config and non-empty
    for (var k in query) {
        val = query[k];
        if (config.searchTerms.includes(k) && val !== "") {
            parsed[k] = val;
        }
    }
    return parsed;
}

//Mongo has an variable for options, which controls elements like max count, ect.
function getOptions(query) {
    let options = {};
    options.limit = parseInt(query.resultsPerPage);
    return options;
}


module.exports.getLocalPathFromDb = function (query) {

    let result = getResultsFromDB(query, submission);
    return result;
}

module.exports.updateLocalPathInDb = function (filter, update) {

    let result = updateDB(filter, update, submission);
    return result;
}

module.exports.updateMetadate = function (filter, update) {

    let result = updateDB(filter, update, dataCollectionName);
    return result;
}

// returns the results of a query, with the optional mongo options param
async function getResultsFromDB(query, collectionName, options = {}) {
    //todo logic
    try {
        const client = await MongoClient.connect(url);
        const db = client.db(dbName);
        let collection = db.collection(collectionName);
        let result = await collection.find(query, options).toArray();
        return result;
    } catch (e) {
        console.log(e.message)
    }

}

//identical to getResults but only returns the size of the query (for pagination)
async function getQuerySize(query, collectionName, options = {}) {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db(dbName);
        let collection = db.collection(collectionName);
        let result = await collection.count(query, options);
        return result;
    } catch (e) {
        console.log(e.message)
    }

}

async function updateDB(filter, update, collectionName) {
    //todo logic

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    let collection = db.collection(collectionName);
    let res = await collection.updateMany(filter, update);
    if (config.debug)
    {
        console.log(collectionName + "updated!" + "by filter:" + filter + " and set exp: " + update)
        console.log("ret: " + JSON.stringify(res))
        console.log("No. of modified recs: "+res.result.nModified + " ,Ok: " + res.result.ok)
    }



}

// save collection
async function saveObjectToDb(objectTobeSaved, collectionName) {
    let documents;
    documents = objectTobeSaved;
    let dataCollection = client.db(dbName).collection(collectionName);
    await dataCollection.insertMany(documents, function (err, res) {
        if (err) throw err;
        if (config.debug) {
            console.log("Items added to db collection :" + collectionName);
        }
    });
}
async function saveSingleObjectToDb(objectTobeSaved, collectionName) {

    let dataCollection = client.db(dbName).collection(collectionName);
    let res =  await dataCollection.insertOne(objectTobeSaved);
    return res;
}

