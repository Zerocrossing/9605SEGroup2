'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');
const config = require('../config.json');

// Search page render
router.get('/', function (req, res) {
    res.render('search', {
        title: 'Nature\'s Palette',
        searchTerms: config.searchTerms,
        results: undefined,
    });
});

// Post request: responds to search query
router.post('/', async function (req, res) {
    let query = req.body;
    let count = db.getQuerySize(query);
    let results = db.getQueryResults(query);
    res.render('search',
        {
            title: 'Nature\'s Palette',
            searchTerms: config.searchTerms,
            displayResults: config.displayResults,
            results: await results,
            count: await count
        }
    )
});

module.exports = router;
