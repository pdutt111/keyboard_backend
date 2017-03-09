var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var config= require('config');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var auth=require('./authentication/authentication');
var details=require('./authentication/detailsFetch');
var log = require('tracer').colorConsole(config.get('log'));
var keyboardCalls = require('./routes/keyboardCalls');
var users = require('./routes/usersCalls');
var dataCalls = require('./routes/dataCalls');
require('./event_recievers/smsSender');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({ limit:'10mb'}));
app.use(bodyParser.raw({ limit:'10mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit:'10mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * middleware to authenticate the jwt and routes
 */
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, content-type, user-agent, connection, host, referer, accept-encoding, accept-language');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.use(function(req,res,next){
    //log.info(req.headers,req.method);
    if(req.method=="OPTIONS"){
        res.end();
    }else{
        next();
    }
})
app.use(
    function(req,res,next){
      auth(req,res)
          .then(function(user){
            req.user=user;
            next();
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          })
    },
    function(req,res,next){
      details(req,res)
          .then(function(user){
            req.user = user;
            next();
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          });
    });

/**
 * routes
 */
app.use('/api/v1/keyboard', keyboardCalls);
app.use('/api/v1/users', users);
app.use('/api/v1/data', dataCalls);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    log.info(req);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    //res.status(err.status || 500);
    //res.render('error', {
    //  message: err.message,
    //  error: err
    //});
    log.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message,
        error: err
      });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  //res.status(err.status || 500);
  //res.render('error', {
  //  message: err.message,
  //  error: {}
  //});
  log.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    error: ""
  });
});


module.exports = app;
