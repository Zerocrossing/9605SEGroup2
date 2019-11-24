'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');
const config = require('../config.json');

// Login page render
router.get('/', function (req, res) {
    res.render('login', {title: 'Nature\'s Palette'});
});

router.post('/',async function (req, res) {

    if(typeof (req.body.createButton) != "undefined")
    {
        let ret =await db.register(req.body.userName, req.body.password, req.body.email);

        if (ret.success == 0 )
            res.render('login', {title: 'Nature\'s Palette', msg: ret.message});
        else {
            res.redirect('/login');
        }

    }
    if(typeof (req.body.LoginButton) != "undefined")
    {
        let ret = await db.verifyUser(req.body.userName, req.body.password);

        if(ret.success == 1)
        {
            req.session.userName = req.body.userName;
            res.redirect('/upload');
        }
        else {
            res.render('login', {title: 'Nature\'s Palette', msg: ret.message});
        }

    }


});

module.exports = router;
