'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');

// Search page render
router.get('/', function (req, res) {
    res.render('search', {title: 'Nature\'s Palette'});
});

// Post request: responds to search query
router.post('/', async function (req, res) {
    let query = req.body;
    let results = await db.getQueryResults(query);
    console.log(results);
    res.render('search',
        {
            title: 'Nature\'s Palette',
            results: results
        }
    )
});

module.exports = router;
