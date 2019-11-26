'use strict';
var express = require('express');
var router = express.Router();
var validator = require('../Auxiliaries/Validator');
const db = require('../Auxiliaries/database');
const common = require('../Auxiliaries/common.js');

router.get('/', async function (req, res) {
    if (typeof (req.session.userInfo) === "undefined") {
        res.redirect('/login');
        return;
    }
    let usr = "Bob";
    let submissions = await db.getUserSubmissions(req.session.userInfo["_id"]);
    let submissionDates = makeDateList(submissions);
    res.render('modify', {
        title: 'Nature\'s Palette',
        msg: '',
        userName: usr,
        submissionDates: submissionDates
    });
});

// Post request: uploaded files
router.post('/', function (req, res) {
    // error handling
    if (!req.body.raw || !req.body.meta){
        res.render('generic', {
            title:"Nature's Pallette",
            header: "Upload Error",
            message: "You did not include files in your submission."
        });
        return
    }
    if (!req.body.subID) {
        return res.status(400).send('You did not select an option');
    }
    //todo implement logic for parsing and modifying data
    let submissionID = req.body.subID; //the submission ID for mongo
    let metaFile = req.body.meta;
    let dataFiles = req.body.raw;

    //if successful
    res.render('generic', {
        title:"Nature's Pallette",
        header: "Files Uploaded Successfully!",
        message: "Thank you for using Nature's Palette. The results will be validated and added to your submission shortly."
    });

});


//datelist consists a list of objects with 2 properties, dateStr and id
//datestr is a human readable date
//id is the reference ID of the submission in the database
function makeDateList(submissions) {
    let out = [];
    for (const submission of submissions) {
        let pathArr = submission.path.split("/");
        let dateParsed = parseDate(pathArr[pathArr.length-1]);
        out.push({dateStr : dateParsed, id: submission["_id"]});
    }
    console.log("Made date list: ", out);
    return out;
}

function parseDate(dateStr) {
    console.log("Parse date parsing: ", dateStr);
    let out = "";
    let split = dateStr.split("T")
    out += split[0] + " ";
    out += split[1].replace(/-/g, ":")
    return out;

}

module.exports = router;
