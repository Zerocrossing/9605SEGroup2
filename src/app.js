'use strict';
// module imports
const debug = require('debug')('app');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
var rawFilevalidator = require('./Auxiliaries/rawFilesValidator')


// import routes
const index = require('./routes/index');
const search = require('./routes/search');
const upload = require('./routes/upload');
const download = require('./routes/download');
const login = require('./routes/login');

// load config
const config = require('./config.json');

// init app
const app = express();

// setup app
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret:'anyStringOfText',
    saveUnInitialized: true,
    resave: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

// init views
app.use('/', index);
app.use('/upload', upload);
app.use('/search', search);
app.use('/download', download);
app.use('/login', login);


// start server
app.set('port', process.env.PORT || config.port);
const server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);


    console.log("Scheduler is going to start with interval:" + config.schedulerInterval);
   let scheduler = setInterval(function () {
       // console.log("scheduler is running !");
        rawFilevalidator.processRawFiles();
    }, config.schedulerInterval);
});