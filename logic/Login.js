/**
 * Created by pariskshitdutt on 04/09/15.
 */
var q= require('q');
var config= require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment= require('moment');
var async= require('async');
var db=require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var crypto=require('../authentication/crypto');
var bcrypt = require('bcrypt');
var request=require('request');

var userTable;
var pinTable;
    userTable=db.getuserdef;
    pinTable=db.getpindef;
var feedbackTable=db.getfeedbackdef;

var users={
    pinLogic:function(req,res){
        var def = q.defer();
        if(req.body.phonenumber.length==10) {
            var pin = Math.floor(Math.random() * 90000) + 10000;
            pinTable.update({phonenumber: req.body.phonenumber}, {
                    phonenumber: req.body.phonenumber,
                    pin: pin,
                    used: false
                },
                {upsert: true}).exec()
                .then(function (info) {
                    def.resolve(pin);
                }).then(null, function (err) {
                def.reject({status: 500, message: err})
            })
        }else{
            def.reject({status: 400, message: config.get('error.badrequest')});
        }
        return def.promise;
    },
    validateTokenFB:function(req){
        var def= q.defer();
        request("https://graph.facebook.com/debug_token?%20input_token="+req.body.fb_token+"&access_token="+config.get("fb_access_token"),function(err,response,body){
            var body=JSON.parse(body);
            log.info(body);
            if(!err){
                if(body.data&&(!body.data.error)&&body.data.user_id){
                    if((new Date).getTime() / 1000<Number(body.data.expires_at)&&body.data.app_id==config.get("fb_app_id")){
                        req.body.fb_user_id=body.data.user_id;
                        def.resolve()
                    }else{
                        def.reject({status: 401, message: config.get('error.unauthorized')})
                    }
                }else{
                    def.reject({status: 401, message: config.get('error.unauthorized')})
                }
            }else{
                def.reject({status: 500, message: config.get('error.dberror')})
            }
        });
        return def.promise;
    },
    validateTokenTwitter:function(req){
        var def= q.defer();
        request("https://graph.facebook.com/debug_token?%20input_token="+req.body.fb_token+"&access_token="+config.get("fb_access_token"),function(err,response,body){
            var body=JSON.parse(body);
            log.info(body);
            if(!err){
                if(body.data&&(!body.data.error)&&body.data.user_id){
                    if((new Date).getTime() / 1000<Number(body.data.expires_at)&&body.data.app_id==config.get("fb_app_id")){
                        req.body.fb_user_id=body.data.user_id;
                        def.resolve()
                    }else{
                        def.reject({status: 401, message: config.get('error.unauthorized')})
                    }
                }else{
                    def.reject({status: 401, message: config.get('error.unauthorized')})
                }
            }else{
                def.reject({status: 500, message: config.get('error.dberror')})
            }
        });
        return def.promise;
    },
    validateTokenGP:function(req){
        var def= q.defer();
        request("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token="+req.body.gptoken,function(err,response,body){
            var body=JSON.parse(body);
            log.info(body);
            if(!err){
                if(body.data&&(!body.data.error)&&body.email){
                    if((new Date).getTime() / 1000<Number(body.exp)&&body.aud==config.get("gp_app_id")){
                        req.body.google_user_id=body.sub;
                        def.resolve()
                    }else{
                        def.reject({status: 401, message: config.get('error.unauthorized')})
                    }
                }else{
                    def.reject({status: 401, message: config.get('error.unauthorized')})
                }
            }else{
                def.reject({status: 500, message: config.get('error.dberror')})
            }
        });
        return def.promise;
    },
    userCreate:function(req,res){
            var def= q.defer();
            bcrypt.genSalt(10, function(err, salt) {
                if(!req.body.password){
                    var passInterim=randomString(5,'aA#')
                }else{
                    var passInterim=req.body.password;
                }
                bcrypt.hash(passInterim, salt, function(err, hash) {
                    // Store hash in your password DB.
                    if(req.body.password){
                        req.body.password=hash;
                        req.body.password_interim=null;
                    }else{
                        req.body.password=hash;
                        req.body.password_interim=passInterim;
                    }
                    req.body._id=new ObjectId();
                    var user = new userTable(req.body);
                    user.save(function(err,user,info){
                        if(!err){
                            var tokendata={
                                _id:user._id,
                                email:user.email,
                            };
                            def.resolve(tokendata);
                        }else{
                            log.info(err);
                            if(err.code==11000) {
                                    userTable.findOne({email:req.body.email},"email fb_user_id",function(err,user){
                                        if(!err&&user) {
                                            if(req.body.fb_user_id==user.fb_user_id){
                                                def.resolve(user);
                                            }else if(req.body.google_user_id==user.google_user_id){
                                                def.resolve(user);
                                            }else if(req.body.password){
                                                bcrypt.compare(req.body.password,user.password,function(err,res){
                                                    if(err){
                                                        def.reject({status: 500, message: config.get('error.dberror')});
                                                        return;
                                                    }
                                                    if(res){
                                                        def.resolve(user);
                                                    }else{
                                                        def.reject({status: 401, message: config.get('error.unauthorized')});
                                                    }
                                                });
                                            }
                                            else{
                                                def.reject({status:401,message:config.get('error.unauthorized')});
                                            }
                                        }else{
                                            log.warn(err);
                                            def.reject({status: 500, message: config.get('error.dberror')});
                                        }
                                    })
                            }else{
                                log.warn(err);
                                def.reject({status: 500, message: config.get('error.dberror')});
                            }
                        }
                    });
                });
            });

            return def.promise;
        },
    signin:function(req,res){
        var def= q.defer();
        userTable.findOne({email:req.body.email},"_id email password").exec()
            .then(function(user){
                if(user){
                    bcrypt.compare(req.body.password,user.password,function(err,res){
                        if(err){
                            def.reject({status: 500, message: config.get('error.dberror')});
                            return;
                        }
                        if(res){
                            def.resolve(user);
                        }else{
                            def.reject({status: 401, message: config.get('error.unauthorized')});
                        }
                    });
                }else{
                    def.reject({status: 401, message: config.get('error.unauthorized')});
                }
            })
            .then(null,function(err){
                log.info(err);
                def.reject({status: 500, message: config.get('error.dberror')});
            });
        return def.promise;
    },
    verifyPhonenumber:function(req,res){
        var def=new q.defer();
      pinTable.findOne({phonenumber:req.body.phonenumber,pin:req.body.pin,used:false}).exec()
          .then(function(pin){
              if(pin){
                  userTable.findOne({phonenumber:req.body.phonenumber},"phonenumber name is_verified is_operator is_admin",function(err,user) {
                      if(!err&&user) {
                          pinTable.update({phonenumber:req.body.phonenumber},{$set:{used:true}}).exec()
                              .then(function(info){
                                  log.info(info);
                              })
                              .then(null,function(err){
                                  log.warn(err)
                              })
                          user.is_verified=true;
                          user.save(function(err,user,info){
                              var tokendata={
                                  _id:user._id,
                                  phonenumber:user.phonenumber,
                                  name:user.name,
                                  email:user.email,
                                  is_verified:user.is_verified,
                                  is_operator:user.is_operator,
                                  is_admin:user.is_admin

                              };
                              def.resolve(tokendata);
                          });
                      }else{
                          def.reject({status: 404, message: config.get('error.notfound')});
                      }
                  });
              }else{
                  def.reject({status: 401, message: config.get('error.unauthorized')});
              }
          })
          .then(null,function(err){
              def.reject({status: 500, message: config.get('error.dberror')});
          });
        return def.promise;
    },
    renewToken:function(req,res){
        var def= q.defer();
        if(req.user._id==req.body.secret) {
            def.resolve();
        }else{
            def.reject({status:401,message:config.get('error.unauthorized')});
        }
        return def.promise;
    },
    sendToken:function(req,res){
        log.info(req.secret);
        var def= q.defer();
        delete req.user.is_operator;
        delete req.user.password;
        var expires = new Date(moment().add(config.get('token.expiry'), 'days').valueOf()).toISOString();
        var token_data={
            user: req.user,
            exp: expires
        };
        var token = jwt.encode({
            data:crypto.encryptObject(token_data)
        }, config.get('jwtsecret'));
        var response={
            token: token,
            secret:req.user._id,
            expires: expires
        };
        if(!req.secret){
           delete response.secret;
        }

        def.resolve(response);
        return def.promise;
    },
    updateUserProfile:function(req,res){
        var def= q.defer();
            for(var key in req.body){
                if(key!="name"&&key!="profession"&&key!="address"&&key!="phonenumber"){
                    delete req.body[key];
                }
            }
            userTable.update({_id:new ObjectId(req.user._id)},{$set:req.body}).exec()
                .then(function(info) {
                    userTable.findOne({_id:new ObjectId(req.user._id)},"phonenumber name is_verified is_operator is_admin",function(err,user){
                        if(!err&&user){
                            def.resolve(user);
                        }else{
                            def.reject({status: 500, message: config.get('error.dberror')});
                        }
                    })
                })
                .then(null,function(err){
                    log.warn(err);
                    def.reject({status: 500, message: config.get('error.dberror')});
                })
        return def.promise;
    }
};
function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}
module.exports=users;