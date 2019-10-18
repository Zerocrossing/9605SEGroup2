'use strict';
const debug = require('debug')('app');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// DB COMMENTED OUT FOR ASSIGN 1
// const mongojs = require('mongojs');
const fs = require('fs');

const routes = require('./routes/index');
const about = require('./routes/about');

const app = express();
/*const db = mongojs('localhost/natureDB', [
    'files',
    'users'
]);*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use('/', routes);
app.use('/about', about);

// File Cache for error messages.
let fileCache = [];
let descriptionCache = {};

app.post('/upload', function (req, res) {

    if (!req.files || Object.keys(req.files).length === 0) {
        fs.readdir("./uploads/", function (err2, items) {
            if (err2) {
                console.log(err2);
                return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache, descriptions: descriptionCache });
            }

            updateCaches(items, function (err3) {
                if (err3) {
                    console.log(err3);
                    return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache, descriptions: descriptionCache });
                }
            });
        });
        return res.status(400).render('index', { title: 'Nature\'s Palette', status: 'No file(s) uploaded.', files: fileCache, descriptions: descriptionCache });
    }

    let files = req.files[Object.keys(req.files)[0]];

    if (typeof (files.length) === 'undefined') {
        files = [files];
    }

    for (let file = 0; file < files.length; file++) {
        let extension = files[file].name.split(".");
        let fileName = './uploads/' + files[file].md5 + "." + extension[extension.length - 1];
        files[file].mv(fileName, function (err) {
            if (err) {
                console.log(err);
                return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error uploading a file(s).', files: fileCache, descriptions: descriptionCache });
            } 

            fs.writeFile(fileName + "-description", req.body.description, function(err) {
                if (err) {
                    console.log(err);
                    descriptionCache[fileName] = "";
                    return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error uploading a file(s).', files: fileCache, descriptions: descriptionCache });
                }

                /*db.files.insert({ file: fileName }, function (err, res) {
                    if (err) console.log(err);
                });*/

                if (file >= files.length - 1) {
                    /*db.files.find().sort([['_id', -1]], function (err2, res2) {
                        if (err2) {
                            console.log(err);
                            return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).' });
                        }
    
                        let fileArr = [];
                        for (let i = 0; i < res2.length; i++) {
                            fileArr.push(res2[i].file);
                        }
    
                        res.render('index', { title: 'Nature\'s Palette', status: 'File(s) uploaded.', files: fileArr });
                    });*/

                    fs.readdir("./uploads/", function (err2, items) {
                        if (err2) {
                            console.log(err2);
                            return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache, descriptions: descriptionCache });
                        }

                        updateCaches(items, function (err3) {
                            if (err3) {
                                console.log(err3);
                                return res.status(500).render('index', { title: 'Nature\'s Palette', status: 'Error updating a file(s).', files: fileCache, descriptions: descriptionCache });
                            }

                            res.render('index', { title: 'Nature\'s Palette', files: fileCache, descriptions: descriptionCache });
                        });
                    });
                }
            });
        });
    }
});

function updateCaches(items, callback) {
    fileCache = [];
    if (items.length <= 0) {
        descriptionCache = {};
        callback(null);
    }

    let count = 0;
    for (let i in items) {
        fs.readFile("./uploads/" + items[i], function (err, data) {
            if (err) {
                callback(err);
            }

            console.log(items[i]);

            if (items[i].length > 11 && items[i].substr(items[i].length - 11) == 'description') {

                let descName = items[i].substring(0, items[i].length - 12);
                descriptionCache[descName] = data;
            }
            else { fileCache.push(items[i]); }

            if (count >= items.length - 1) {
                callback(null);
            }
            count++;
        });
    }
}

// Setup database
/*db.getCollectionNames(function (err, collections) {
    if (err) {
        console.log(err);
        process.exit();
    }

    if (collections.indexOf('files') === -1) {
        console.log("Creating collection natureDB.files");
        db.createCollection('files', {}, function (err, collection) {
            if (err) console.log(err);
        });
    }

    if (collections.indexOf('users') === -1) {
        console.log("Creating collection natureDB.users");
        db.createCollection('users', {}, function (err, collection) {
            if (err) console.log(err);
        });
    }
});*/

/*
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
*/

app.set('port', process.env.PORT || 3332);

const server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
