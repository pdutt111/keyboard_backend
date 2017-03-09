var request= require('request');
var noble = require('noble');
const bluetooth = require('node-bluetooth');
var fs=require('fs');

var output=fs.createWriteStream('bl_devices.csv');
output.write('mac,name,signal,date\n');
noble.on('stateChange', function(state) {
    if (state === 'poweredOn')
        noble.startScanning();
    else
        noble.stopScanning();
});
setInterval(function(){
    devices=[];
    noble.stopScanning();
    noble.startScanning();
},40000);
noble.on('discover', function(peripheral){
    var device={}
    if(!peripheral.advertisement.localName){
        peripheral.advertisement.localName="";
    }
    console.log(peripheral);
    output.write("'"+peripheral.address+",'"+peripheral.advertisement.localName.replace(/,/g,"")+"','"+peripheral.rssi+"','"+new Date().toUTCString()+"'\n");

});