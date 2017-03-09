/**
 * Created by pariskshitdutt on 08/03/16.
 */
var q= require('q');
var config= require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment= require('moment');
// var multer=require('multer')
var async= require('async');
var db=require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var crypto=require('../authentication/crypto');
var bcrypt = require('bcrypt');
var appTable=db.getappsdef;

var runs={
    getApps:function(req){
        var def=q.defer();
        appTable.find({enabled:true},"_id name image enabled",function(err,apps){
            if(!err){
                def.resolve(apps);
            }else{
                def.reject({status: 500, message: config.get('error.dberror')});
            }
        });
        return def.promise;
    }
};
module.exports=runs;