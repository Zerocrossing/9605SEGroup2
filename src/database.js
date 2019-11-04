const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const config = require('./config.json');
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
if (config.debug){
    testConnection();
}

module.exports.post = function (fileObj) {
    console.log("Recieved a request to store a file named " + fileObj.name);
    //todo logic
};

module.exports.get = function (fileID) {
    console.log('Recieved a request to retrieve a file with ID ' + fileID);
    //todo logic
};