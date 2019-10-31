module.exports.post = function (fileObj) {
    console.log("Recieved a request to store a file named " + fileObj.name);
    //todo logic
};

module.exports.get = function (fileID) {
  console.log('Recieved a request to retrieve a file with ID ' + fileID);
  //todo logic
};