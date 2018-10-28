const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const url = require('url');
const fs = require('fs');

const ionicAppDir = '../ionic-app';

//initializes sqlQueries
eval(fs.readFileSync(ionicAppDir + '/src/assets/js/dicziunari-queries.js', 'utf8'));

const port = 8080;

const db = new sqlite3.Database(ionicAppDir + '/www/dicziunari.db', (err) => {
    if (err) {
        console.log("failed opening db: " + err);
    } else {
        console.log("opened db");
    }
});

require('./dicziunariController')(app, db, url, sqlQueries);

app.set('json spaces', 2);
app.listen(port);
