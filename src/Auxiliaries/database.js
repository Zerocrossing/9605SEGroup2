const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const url = config.db.url;
const dbName = config.db.dbName;
const dataCollectionName = config.db.dataCollection;
const userCollectionName = config.db.userCollection;
const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});

//demo functionality, delete eventually
var testConnection = function () {
    client.connect(err => {
        console.log("Database connected");
        const dataCollection = client.db(dbName).collection(dataCollectionName);
        dataCollection.find({}).toArray(function (err, docs) {
            assert.equal(err, null);
            console.log("Found the following records");
            console.log(docs);
        });
        // perform actions on the collection object
        client.close();
    });
};
if (config.debug) {
    testConnection();
}

module.exports.saveData = function (metaObject, fileObject) {
    saveMetaToDatabase(metaObject);
    saveFileToLocal(fileObject);

};

// saves the metadata to the database
function saveMetaToDatabase(metaObject) {
    let documents;
    // currently objects come in as json strings
    if (typeof metaObject.json === 'string' || metaObject.json instanceof String) {
        documents = JSON.parse(metaObject.json);
    } else {
        documents = metaObject.json;
    }
    //todo saving the same file multiple times results in multiple copies entering the DB
    client.connect(err => {
        assert.equal(err, null);
        const dataCollection = client.db(dbName).collection(dataCollectionName);
        dataCollection.insertMany(documents, function (err, res) {
            if (err) throw err;
            if (config.debug) {
                console.log("Items added to DB");
            }
            client.close();
        });
    });
}

// saves the raw data files to the directory given in config.dataFilePath, excluding .csv files
function saveFileToLocal(fileObjects) {
    fileObjects.forEach(function (fileObj) {
        let splitExt = fileObj.name.split(".");
        let ext = splitExt[splitExt.length - 1];
        if (ext === 'csv') {
            return;
        }
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