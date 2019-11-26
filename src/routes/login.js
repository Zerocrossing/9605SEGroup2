'use strict';
var express = require('express');
var router = express.Router();
const db = require('../Auxiliaries/database');
const config = require('../config.json');

// Login page render
router.get('/', function (req, res) {
    let redir = !req.query.redir ? 'upload' : req.query.redir;
    res.render('login', {title: 'Nature\'s Palette', msg: '', redir:redir});
});

router.post('/',async function (req, res) {
    console.log("login request query: ", req.query);
    console.log("login request query.redir", req.query.redir);
    let redir = !req.query.redir? 'upload' : req.query.redir;
    console.log("login post redir: ", redir);
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
        console.log("Sign in by user: ", ret.user);
        if(ret.success == 1)
        {
            req.session.userInfo = ret["user"];
            res.redirect('/'+redir);
        }
        else {
            res.render('login', {title: 'Nature\'s Palette', msg: ret.message});
        }

    }


});

module.exports = router;
