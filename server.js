//  OpenShift sample Node application
var express = require('express'),
    fs = require('fs'),
    app = express(),
    eps = require('ejs'),
    morgan = require('morgan');

Object.assign = require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
        mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
        mongoPassword = process.env[mongoServiceName + '_PASSWORD']
    mongoUser = process.env[mongoServiceName + '_USER'];

    if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
            mongoURL += mongoUser + ':' + mongoPassword + '@';
        }
        // Provide UI label that excludes user id and pw
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;

    }
}
var db = null,
    dbDetails = new Object();

var initDb = function (callback) {
    if (mongoURL == null) return;

    var mongodb = require('mongodb');
    if (mongodb == null) return;

    mongodb.connect(mongoURL, function (err, conn) {
        if (err) {
            callback(err);
            return;
        }

        db = conn;
        dbDetails.databaseName = db.databaseName;
        dbDetails.url = mongoURLLabel;
        dbDetails.type = 'MongoDB';

        console.log('Connected to MongoDB at: %s', mongoURL);
    });
};

app.get('/', function (req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function (err) { });
    }
    if (db) {
        var data = req.query['data'];
        var rand = req.query['rand'];
        //data = "D2016,8,18,2,30,0;T2016,8,18,0,30,0;T2016,8,18,1,0,0;T2016,8,18,1,30,0;M2016,8,18,2,0,0;T2016,8,18,3,0,0;T2016,8,18,3,30,0;T2016,8,18,4,0,0;T2016,8,18,4,30,0;T2016,8,18,5,0,0;T2016,8,18,5,30,0;T2016,8,18,6,0,0;M2016,8,18,6,30,0;M2016,8,18,7,0,0;M2016,8,18,7,30,0;T2016,8,18,8,0,0;T2016,8,18,8,30,0;T2016,8,18,9,0,0;T2016,8,18,9,30,0";
        //rand = "6ionafoa28gvh";
        var col = db.collection('counts');
        // Create a document with request IP and current time of request
        col.insert({ ip: req.ip, date: Date.now(), data: data, rand: rand });
        col.count(function (err, count) {
            var d = col.find("data"); //?
            console.log(d);
            res.render('index.html', {
                pageCountMessage: count + 8619,
                dbInfo: dbDetails,
                data: data
            });
        });
    } else {
        res.render('index.html', { pageCountMessage: null });
    }
});

app.get('/pagecount', function (req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function (err) { });
    }
    if (db) {
        db.collection('counts').count(function (err, count) {
            res.send('{ pageCount: ' + count + '}');
        });
    } else {
        res.send('{ pageCount: -1 }');
    }
});

// error handling
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

initDb(function (err) {
    console.log('Error connecting to Mongo. Message:\n' + err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;