const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const enums = require('../Auxiliaries/enums.js');
const url = config.db.url;
const dbName = config.db.dbName;
const dataCollectionName = config.db.dataCollection;
const userCollectionName = config.db.userCollection;
const LocalPathsOfRawFiles = config.db.LocalPathsOfRawFiles;
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
    saveObjectToDb(metaObject, dataCollectionName);
    saveFileToLocal(fileObject);
    savePathToDb();
};

function savePathToDb() {
    let rec = {}
    let recs = []

    rec["path"] = config.dataFilePath + "/" + config.tempUser.userName
    rec["processingStatus"] = enums.processingStatus.unprocessed;
    recs.push(rec)
    saveObjectToDb(recs, LocalPathsOfRawFiles);

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

    /*try {
        fs..accessSync(myDir);
    } catch (e) {
        fs.mkdirSync(myDir);
    }*/

    let pathToSave = config.dataFilePath + "/" + config.tempUser.userName;
    if (!fs.existsSync(pathToSave)) {
        fs.mkdirSync(pathToSave);
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

function parseQuery(query) {
    //todo logic
    query = {};
    for (var k in query) {
        val = query[k];
        console.log(val);
        if (true) {
            query.k = val;
        }
    }
    console.log(query);
    return query; //todo right now this always returns en empty query, which returns the whole DB
}

function getOptions(query) {
    let options = {};
    options.limit = parseInt(query.resultsPerPage);
    return options;
}


module.exports.getLocalPathFromDb = function (query) {

    let result = getResultsFromDB(query, LocalPathsOfRawFiles);
    return result;
}

module.exports.updateLocalPathInDb = function (filter, update) {

    let result = updateDB(filter, update, LocalPathsOfRawFiles);
    return result;
}


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

async function updateDB(filter, update, collectionName) {
    //todo logic
    try {
        const client = await MongoClient.connect(url);
        const db = client.db(dbName);
        let collection = db.collection(collectionName);
        let res = await collection.updateMany(filter, update);
        if (config.debug)
            console.log(res.result.nModified + "Ok: " + res.result.ok)
    } catch (e) {
        console.log(e.message)
    }


}

// save collection
async function saveObjectToDb(objectTobeSaved, collectionName) {

    try {
        let documents;
        documents = objectTobeSaved;
        let dataCollection = client.db(dbName).collection(collectionName);
        await dataCollection.insertMany(documents, function (err, res) {
            if (err) throw err;
            if (config.debug) {
                console.log("Items added to db collection :" + collectionName);
            }
        });
    } catch (e) {
        console.log(e.message)
    }

}

