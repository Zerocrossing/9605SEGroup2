'use strict';
var express = require('express');
var router = express.Router();
var validator = require('../Auxiliaries/Validator');
const db = require('../Auxiliaries/database');
const common = require('../Auxiliaries/common.js');
const modification = require('../Auxiliaries/modification.js');

router.get('/', async function (req, res) {
    if (typeof (req.session.userInfo) === "undefined") {
        res.redirect('/login' + '?redir=modify');
        return;
    }
    let usr = "Bob";
    let submissions = await db.getUserSubmissions(req.session.userInfo["_id"]);
    // console.log("@@@@submissions" + JSON.stringify(submissions))
    let submissionDates = makeDateList(submissions);
    res.render('modify', {
        title: 'Nature\'s Palette',
        msg: '',
        userName: usr,
        submissionDates: submissionDates,
        user: req.session.userInfo
    });
});

// Post request: uploaded files
router.post('/', async function (req, res) {
    // error handling
    if (!req.files || !req.files.raw || !req.files.meta){
        res.render('generic', {
            title:"Nature's Pallette",
            header: "Upload Error",
            message: "You did not include files in your submission.",
            user: req.session.userInfo
        });
        return
    }
    if (!req.body.subID) {
        return res.status(400).send('You did not select an option');
    }
    //todo implement logic for parsing and modifying data
    let submission = await db.getSubmissionFromID(req.body.subID);
    let metaFile = req.files.meta;
    let dataFiles = req.files.raw;

    let retVal = await modification.modifySubmission(submission, metaFile, dataFiles, req.session);
    // console.log("**retVal**" + JSON.stringify(retVal))
    if(!retVal.success)
        res.render('upload', {title: 'Nature\'s Palette', msg: 'There was an error modifying the submission.\n' + retVal.message});
    else
        res.render('generic', {
            title:"Nature's Pallette",
            header: "Files Uploaded Successfully!",
            message: "Thank you for using Nature's Palette. The results will be validated and added to your submission shortly.",
            user: req.session.userInfo
        });


    //if successful


});


//datelist consists a list of objects with 2 properties, dateStr and id
//datestr is a human readable date
//id is the reference ID of the submission in the database
function makeDateList(submissions) {
    let out = [];
    // console.log(submissions);
    for (const submission of submissions) {
        // console.log(submission)
        let pathArr = submission.path.split("/");
        let dateParsed = parseDate(pathArr[pathArr.length-1]);
        out.push({dateStr : dateParsed, id: submission["_id"]});
    }
    return out;
}

function parseDate(dateStr) {
    let out = "";
    let split = dateStr.split("T")
    out += split[0] + " ";
    out += split[1].replace(/-/g, ":")
    return out;

}

module.exports = router;
