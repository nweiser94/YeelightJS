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

/**
 * 
 */
YeelightJS.prototype.sendCommand = function(bulb, request){
    if(bulb.connected === false){
        return;
    }
    console.log(request);
    var json = JSON.stringify(request).concat('\r\n');
    bulb.socket.write(json);
}

var requests = [];

/**
 * 
 */
YeelightJS.prototype.connect = function(host, id) {
    if(host){
        var bulb = {
            socket: new net.Socket(),
            connected: false,
            host: host,
            id: id
        }
        bulb.socket.on('data', function(data) {
            var json = JSON.parse(data.toString());
            var request;
            var tmp = requests.filter(e => e.id === json.id);
            if(tmp.length > 0){
                request = tmp[0];
            }
            requests.splice(requests.indexOf(request), 1);
            handleData(json, request, bulb);
            this.emit('response_received', json, bulb)
        }.bind(this));
        bulb.socket.on('close', function(err) {
            bulb.socket = null;
            bulb.connected = false;
            this.emit('device_disconnected', bulb);
        });
        bulb.socket.connect({port: options.PORT, host: bulb.host}, function() {
            console.info(success(`Successfully connected to device: ${host}`));
            bulb.connected = true;
            this.emit('device_connected', bulb);
        }.bind(this));

        this.fetchCurrentState(bulb);
    }
}

var handleData = function(json, request, bulb){
    if(request !== undefined && request.method === 'get_prop'){
        for(var i = 0; i < request.params.length; i++){
            var param_name = request.params[i];
            var param_value = json.result[i];
            set_prop(param_name, param_value, bulb);
        }
    }else{
        console.log(json);
    }
}

var set_prop = function(name, value, bulb) {
    switch (name) {
        case 'power':
            bulb.power = value;
            break;
        case 'bright':
            bulb.bright = value;
            break;
        case 'ct':
            bulb.ct = value;
            break;
        case 'rgb':
            bulb.rgb = calcRGB(value);
            break;
        case 'hue':
            bulb.hue = value;
            break;
        case 'sat':
            bulb.sat = value;
            break;
        case 'color_mode':
            bulb.color_mode = value;
            break;
        case 'flowing':
            bulb.flowing = value;
            break;
        case 'name':
            bulb.name = value;
            break;
        default:
            break;
    }
}

var calcRGB = function(rgbdec){
    return [
        (rgbdec >> 16) & 0xff,
        (rgbdec >> 8) & 0xff,
        rgbdec & 0xff
    ];
}

/**
 * 
 */
YeelightJS.prototype.fetchCurrentState = function(bulb) {
    if(bulb.connected === false && bulb.socket === null){
        console.err(err(`Disconnected device: ${bulb.host}`));
    }
    var request = {
        id: bulb.id,
        method: 'get_prop',
        params: ['power','bright','ct','rgb','hue','sat','color_mode','flowing','name']
    }
    requests.push(request);
    var json = JSON.stringify(request).concat('\r\n');
    bulb.socket.write(json);
}

const options = {
    PORT: 55443
}


module.exports = YeelightJS;