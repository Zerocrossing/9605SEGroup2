'use strict';
var express = require('express');
var router = express.Router();
var validator = require('../Auxiliaries/Validator')
const db = require('../database')

// Upload page render
router.get('/', function (req, res) {
    res.render('upload', {title: 'Nature\'s Palette'});
});

// Post request: uploaded files
router.post('/', function (req, res) {
    // null file check
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    //region Validation
    let rawFileNames =[]
    let retVal;
    let csvFileNo = 0;
    let files = req.files;
    //csv and Transmission should be in config
    // just one csv file is allowed, all the others should be rawfile
    for (let i = 0; i < files.length; i++){
        let splittedName = files[i].name.split(".");
        var ext = splittedName[splittedName.length-1];

        if(ext === 'csv'){

            csvFileNo++;
            if(csvFileNo>1)
            {
                console.log("You are allowed to submit just one metadata file in each upload!");
                //Stop and show error message to the user
            }
            let content  = files[i].data.toString();
            retVal = validator.csvJSON(content);


        } else if (ext ==='Transmission')
        {
            rawFileNames.push(splittedName[0]+splittedName[1])
        }
        else
        {
            console.log("There are invalid type of file in the submission!")
            //Stop and show error message to the user
        }
    }

    let isMatch = validator.matchRawFilesAndMetadataFiles(rawFileNames,retVal.fileNames)
    let emptyMandatoryFields = validator.checkMandatoryFields(retVal.json)
    //endregion validation

    //DEBUG display the names of the files and make a fake request to the DB
    // var out = '';
    // // multiple files are stored in an array
    // if (Array.isArray(req.files.uploaded)) {
    //     for (var file in req.files.uploaded) {
    //         var fileObj = req.files.uploaded[file];
    //         db.post(fileObj);
    //         out += fileObj.name + '<br>';
    //     }
    // //single files an object
    // } else {
    //     db.post(req.files.uploaded);
    //     out += req.files.uploaded.name;
    // }
    // res.send('You uploaded these files:<br>' + out);

});

module.exports = router;