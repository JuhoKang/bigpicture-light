const express = require('express');
const mongoose = require('mongoose');
// uncomment after placing your favicon in /public
// const favicon = require('serve-favicon');
const path     = require('path');

const app = express();
const server = require('http').createServer(app);

//image data
app.use(express.static('data'));

// configure router, socket
require('./config/socket')( server );
require('./config/routes')( app );
//require('./config/timer').imageTimer(app);

// configure mongoose
// setup default mongoose module

const mongoDB = 'mongodb://127.0.0.1:27017/bigpicture';
mongoose.Promise = global.Promise;
// mongoose.set('debug', true);

/* mongoose.connect(mongoDB, {
  useMongoClient: true,
}).then((db) => {
  db.on('authenticated', () => {
    console.log('authenticated to mongo');
  });

  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
}); */
mongoose.connect(mongoDB);
// const db = mongoose.connection;

module.exports = { app, server };
