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


module.exports.saveData = function (metaObject, fileObject, userName = "noUser") {
    appendData(metaObject, userName);
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

//adds extra data to the metadata file used by processing and other
function appendData(metaObject, userName) {
    let path = config.dataFilePath + "/" + userName + "/";
    for (elem of metaObject) {
        elem.filePath = path + elem.FileName;
    }
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
//todo need to store a reference to a file's location in the database
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

//takes in the raw post request and returns the size of the query (for pagination)
module.exports.getQuerySize = function (query) {
    let parsedQuery = parseQuery(query);
    let count = getQuerySize(parsedQuery, dataCollectionName);
    return count;
};

//This function takes in the querystring from the page form and returns a mongo-appropriate query
function parseQuery(query) {
    parsed = {};
    // console.log("Parsing query", query)
    //Only accept search terms defined in config and non-empty
    for (var k in query) {
        val = query[k];
        // logical OR case
        if (val.toLowerCase().includes("or")) {
            parsed.$or = [];
            val.toLowerCase().split("or").forEach(elem => {
                let pElem = parseTerm(elem);
                let q = {};
                q[k] = pElem;
                parsed.$or.push(q);
            })
        } else if (config.searchTerms.includes(k) && val !== "") {
            parsed[k] = parseTerm(val);
        }
    }
    return parsed;
}

//takes a string such as "Merops" and returns the value for a mongo query
//todo regex this for case insensitivity
function parseTerm(term) {
    return term.trim();
}

//Mongo has an variable for options, which controls elements like max count, ect.
function getOptions(query) {
    let options = {};
    options.limit = parseInt(query.resultsPerPage);
    let limit = parseInt(query.page) * options.limit;
    options.skip = limit;
    return options;
}


module.exports.getLocalPathFromDb = function (query, parse = false) {
    if (parse) {
        query = parseQuery(query);
    }
    let result = getResultsFromDB(query, LocalPathsOfRawFiles);
    return result;
};

//as above but assumes files store their own filePath attributes
module.exports.getPathsFromQuery = async function(query)
{
    query = parseQuery(query);
    console.log(query);
    let proj = {"filePath": 1};
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    let collection = db.collection(dataCollectionName);
    // let result = await collection.find(query).project({}).toArray();
    let result = await collection.find(query).project(proj).toArray();
    client.close()
    return result;
};

module.exports.updateLocalPathInDb = function (filter, update) {

    let result = updateDB(filter, update, LocalPathsOfRawFiles);
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
        client.close();
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
        client.close();
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
        client.close();
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

