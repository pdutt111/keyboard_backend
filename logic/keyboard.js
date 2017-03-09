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
var keyboardTable= db.getkeyboarddef;

var runs={
    addVariable:function(req){
        var def= q.defer();
        if(req.body.position){
            keyboardTable.findOneAndUpdate({user_id:new ObjectId(req.user._id),position:req.body.position,name:req.body.name}
                , {user_id:new ObjectId(req.user._id),position:req.body.position,name:req.body.name,value:req.body.value}
                , {upsert:true}, function(err, doc){
                    if (err) {
                        def.reject({status: 500, message: config.get('error.dberror')});
                    }else{
                        def.resolve(config.get('ok'));
                    }
                });
        }else{
            def.reject({status: 400, message: config.get('error.badrequest')});
        }

        return def.promise;
    },
    removeVariable:function(req){
        var def= q.defer();
        keyboardTable.remove({user_id:new ObjectId(req.user._id),position:req.body.position}
            , function(err, doc){
                if (err) {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }else{
                    def.resolve(config.get('ok'));
                }
            });
        return def.promise;
    },
    getVariables:function(req){
        var def= q.defer();
        keyboardTable.find({user_id:new ObjectId(req.user._id)},"name value position"
            , function(err, docs){
                if (err) {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }else{
                    def.resolve(docs);
                }
            });
        return def.promise;
    }
};
module.exports=runs;