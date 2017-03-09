const bluetooth = require('node-bluetooth');

// create bluetooth device instance
const device = new bluetooth.DeviceINQ();

device
    .on('finished',  console.log.bind(console, 'finished'))
    .on('found', function found(address, name){
        console.log('Found: ' + address + ' with name ' + name);
    }).inquire();