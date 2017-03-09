var express = require('express');
var router = express.Router();
var params = require('parameters-middleware');
var config = require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment = require('moment');
var async = require('async');
var db = require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn = require('../notificationSenders/apnsender');
var gcm = require('../notificationSenders/gcmsender');
var crypto = require('../authentication/crypto');

var usersLogic = require('../logic/Login');
var userTable;

userTable = db.getuserdef;
router.post('/create', params({body: ['email']}, {message: config.get('error.badrequest')}),
    function (req, res, next) {
    log.info(req.body);
    if(req.body.fb_token){
        usersLogic.validateTokenFB(req)
            .then(function () {
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            })
    }else if(req.body.gp_token){
        usersLogic.validateTokenGP(req)
            .then(function () {
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            })
    }else if(req.body.password){
        next();
    }else if(req.body.twitter_token){

    }
    },
    function (req, res, next) {
        usersLogic.userCreate(req, res)
            .then(function (user) {
                req.user = user;
                req.secret = true;
                next();
            })
            .catch(function (err) {
                log.warn(err);
                res.status(err.status).json(err.message);
            }).done();
    },
    function (req, res, next) {
        usersLogic.sendToken(req, res)
            .then(function (response) {
                res.json(response);
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    });
router.post('/protected/updateUserProfile',
    function (req, res, next) {
        usersLogic.updateUserProfile(req, res)
            .then(function (user) {
                req.user = user;
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    },
    function (req, res, next) {
        usersLogic.sendToken(req, res)
            .then(function (response) {
                res.json(response);
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    });

router.post('/login',params({body: ['email','password']}, {message: config.get('error.badrequest')}),
    function (req, res, next) {
    log.info(req.body);
        usersLogic.signin(req, res)
            .then(function (user) {
                req.user = user;
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    },
    function (req, res, next) {
        req.secret=true;
        usersLogic.sendToken(req, res)
            .then(function (response) {
                res.json(response);
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    });

router.post('/protected/info/renew', params({body: ['secret']}, {message: config.get('error.badrequest')}),
    function (req, res, next) {
        usersLogic.renewToken(req, res)
            .then(function () {
                req.secret = false;
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    },
    function (req, res, next) {
        usersLogic.sendToken(req, res)
            .then(function (response) {
                res.json(response);
            })
            .catch(function (err) {
                log.error(err);
                res.status(500).json(config.get('error.dberror'));
            }).done();
    });

router.get('/protected/info', params({headers: ['authorization']}, {message: config.get('error.badrequest')}), function (req, res, next) {
    req.user = req.user.toObject();
    delete req.user.password;
    delete req.user._id;
    res.json(req.user);
});
module.exports = router;
