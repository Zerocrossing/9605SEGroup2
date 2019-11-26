'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');
const config = require('../config.json');
const querystring = require('querystring');

// Search page render
router.get('/', function (req, res) {
    res.render('search', {
        title: 'Nature\'s Palette',
        searchTerms: config.searchTerms,
        results: undefined,
        user: req.session.userInfo
    });
});

// Post request: responds to search query
router.post('/', async function (req, res) {
    let query = req.body;
    let count = db.getQuerySize(query);
    let results = db.getQueryResults(query);
    // todo: form sends all fields, even if blank, so remove them for clarity
    let qString = querystring.stringify(query); //used to forward search results to download
    res.render('search',
        {
            title: 'Nature\'s Palette',
            searchTerms: config.searchTerms,
            displayResults: config.displayResults,
            results: await results,
            count: await count,
            query: query,
            qString: qString,
            user: req.session.userInfo
        }
    )
});

module.exports = router;
