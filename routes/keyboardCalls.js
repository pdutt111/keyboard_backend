var express = require('express');
var router = express.Router();
var params = require('parameters-middleware');
var config= require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment= require('moment');
var async= require('async');
var multer=require('multer');
var db=require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var keyboardLogic=require('../logic/keyboard');

router.post('/protected/keyboard',params({body:['name','value','position']},{message : config.get('error.badrequest')}),
    function(req,res){
        keyboardLogic.addVariable(req)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.delete('/protected/keyboard',params({body:['position']},{message : config.get('error.badrequest')}),
    function(req,res){
        keyboardLogic.removeVariable(req)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.get('/protected/keyboard',
    function(req,res){
        keyboardLogic.getVariables(req)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });


module.exports = router;
