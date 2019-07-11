const net = require('net');
const EventEmitter = require('events').EventEmitter;
const colors = require('colors');
const util = require('util');
util.inherits(YeelightJS, EventEmitter);

function YeelightJS(){
    EventEmitter.call(this);
}

var err = colors.red;
var success = colors.green;


YeelightJS.prototype.sendCommand = function(bulb, request){
    
}


YeelightJS.prototype.connect = function(host, id) {
    if(host){
        var bulb = {
            socket: new net.Socket(),
            connected: false,
            host: host,
            id: id
        }

        bulb.socket.on('data', function(data) {
            this.emit('response_received', data, bulb)
        }.bind(this));
        bulb.socket.connect({port: options.PORT, host: bulb.host}, function() {
            console.info(success(`Successfully connected to device: ${host}`));
            bulb.connected = true;
            this.emit('device_connected', bulb);
        }.bind(this));

        this.fetchCurrentState(bulb);
    }
}

YeelightJS.prototype.fetchCurrentState = function(bulb) {
    if(bulb.connected === false && bulb.socket === null){
        console.err(err(`Disconnected device: ${bulb.host}`));
    }
    var request = {
        id: 0,
        method: 'get_prop',
        params: ['power','bright','ct','rgb','hue','sat','color_mode','flowing','name']
    }
    var jsonRequest = JSON.stringify(request).concat('\r\n');
    bulb.socket.write(jsonRequest);
}

const options = {
    PORT: 55443
}


module.exports = YeelightJS;