'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');

// Search page render
router.get('/', function (req, res) {
    res.render('search', { title: 'Nature\'s Palette' });
});

// Post request: responds to search query
router.post('/', function (req, res) {
    let query = req.body;
    let results = db.getQueryResults(query);
    // DEBUG: print the query back at the user
    var out = "";
    for (var term in req.body){
        console.log(term);
        out+= `${term}: ${req.body[term]}<br>`
    }
    res.send('You searched for:<br>' + out);
});

module.exports = router;
