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
var dataLogic=require('../logic/Data');


router.get('/apps',
    function(req,res){
        dataLogic.getApps(req)
            .then(function(bags){
                res.json(bags);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            });
    });

router.post('/test',
    function(req,res){
    var output=[];
        for(var i=0;i<3000;i++){
            var vals=[]
            for(var j=0;j<10;j++){
                vals.push("text");
            }
            output.push(vals)
        }
        res.json(output);
    });


module.exports = router;


