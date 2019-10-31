'use strict';
var express = require('express');
var router = express.Router();

// Search page render
router.get('/', function (req, res) {
    res.render('search', { title: 'Nature\'s Palette' });
});

// Post request: responds to search query
router.post('/', function (req, res) {
    // DEBUG: print the query back at the user
    var out = "";
    for (var term in req.body){
        console.log(term);
        out+= `${term}: ${req.body[term]}<br>`
    }
    res.send('You searched for:<br>' + out);
});

module.exports = router;
