/**
 * Created by pariskshitdutt on 09/06/15.
 */
var mongoose = require('mongoose');
//var mockgoose=require('mockgoose');
var config = require('config');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var ObjectId = require('mongoose').Schema.Types.ObjectId;
var validate = require('mongoose-validator');
var nameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 50],
        message: 'Name should be between 3 and 50 characters'
    })
];
var emailValidator=[
    validate({
        validator: 'isEmail',
        message: "not a valid email"
    })
];
var phoneValidator = [
    validate({
        validator: 'isLength',
        arguments: [10, 10],
        message: 'phonenumber should be 10 digits'
    })
];
var db=mongoose.createConnection(config.get('mongo.location'),config.get('mongo.database'));

var Schema = mongoose.Schema;
mongoose.set('debug', config.get('mongo.debug'));
/**
 * user schema stores the user data the password is hashed
 * @type {Schema}
 */
var userSchema=new Schema({
    email:{type:String,validate:emailValidator,unique:true,dropDups:true},
    phonenumber:{type:String,validate:phoneValidator},
    password:{type:String},
    name:{type:String},
    fb_token:String,
    fb_user_id:String,
    device:[{service:String,reg_id:String,active:{type:Boolean,default:true}}],
    google_token:String,
    google_user_id:String,
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var keyboardSchema=new Schema({
    user_id:{type:ObjectId,ref:'users'},
    name:String,
    value:String,
    position:{type:Number, required:true},
    is_deleted:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var appsSchema=new Schema({
    name:{type:String,unique:true,dropDups:true},
    image:String,
    enabled:{type:Boolean,defaule:true},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
keyboardSchema.index( { user_id: 1, variable_name: 1, position:1}, { unique: true } );

db.on('error', function(err){
    log.info(err);
});
/**
 * once the connection is opened then the definitions of tables are exported and an event is raised
 * which is recieved in other files which read the definitions only when the event is received
 */
    var userdef=db.model('users',userSchema);
    var keyboarddef=db.model('keyboard',keyboardSchema);
    var appsDef=db.model('apps',appsSchema);
    // var bagTypedef=db.model('bags',bagTypeSchema);

    exports.getuserdef= userdef;
    exports.getkeyboarddef=keyboarddef;
    exports.getappsdef= appsDef;
    // exports.getbagtypedef= bagTypedef;
    events.emitter.emit("db_data");

