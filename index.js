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
 * Sends the given command request to the yeelight.
 */
YeelightJS.prototype.sendCommand = function(yeelight, request){
    if(yeelight.connected === false){
        return;
    }
    console.log(request);
    var json = JSON.stringify(request).concat('\r\n');
    yeelight.socket.write(json);
}

/**
 * Enables the color flow for the given yeelight.
 */
YeelightJS.prototype.setColorFlow = function(yeelight, count, action, expression){

    var request = {
        id: yeelight.id,
        method: 'start_cf',
        params: [
            count,
            action,
            expression
        ]
    };

    this.sendCommand(yeelight, request);

}

YeelightJS.prototype.stopColorFlow = function(yeelight){
    var request = {
        id: yeelight.id,
        method: 'stop_cf',
        params: []
    }

    this.sendCommand(yeelight, request);
}

/**
 * Sets the yeelight rgb value defined by the given rgb array.
 */
YeelightJS.prototype.setRGB = function(yeelight, rgb){
    yeelight.rgb = rgb;
    
    var rgb_val = this.rgb2dec(rgb);

    var request = {
        id: yeelight.id,
        method: 'set_rgb',
        params: [rgb_val, 'smooth', 500]
    };
    this.sendCommand(yeelight, request);
}

/**
 * Sets the yeelight brightness in percentage
 */
YeelightJS.prototype.setBrigtness = function(yeelight, brightness){
    yeelight.bright = brightness;

    var request = {
        id: yeelight.id,
        method: 'set_bright',
        params: [brightness, 'smooth', 500]
    }

    this.sendCommand(yeelight, request);
}

/**
 * Sets the yeelight power state.
 */
YeelightJS.prototype.setPower = function(yeelight, power){
    yeelight.power = power;
    var request = {
        id: yeelight.id,
        method: 'set_power',
        params: [power, 'smooth', 500]
    };
    this.sendCommand(yeelight, request);
}

var stateFetches = [];

/**
 * Connects to the given yeelight identified by its hostaddress and a custom id.
 */
YeelightJS.prototype.connect = function(host, id) {
    if(host){
        var yeelight = {
            socket: new net.Socket(),
            connected: false,
            host: host,
            id: id
        }
        yeelight.socket.on('data', function(data) {
            var json = JSON.parse(data.toString());
            var fetch;
            var tmp = stateFetches.filter(e => e.id === json.id);
            if(tmp.length > 0){
                fetch = tmp[0];
            }
            stateFetches.splice(stateFetches.indexOf(fetch), 1);
            handleData(json, fetch, yeelight);
            this.emit('response_received', json, yeelight)
        }.bind(this));
        yeelight.socket.on('close', function(err) {
            yeelight.socket = null;
            yeelight.connected = false;
            this.emit('device_disconnected', yeelight);
        });
        yeelight.socket.connect({port: options.PORT, host: yeelight.host}, function() {
            console.info(success(`Successfully connected to device: ${host}`));
            yeelight.connected = true;
            this.emit('device_connected', yeelight);
        }.bind(this));

        this.getState(yeelight);
    }
}

var handleData = function(json, request, yeelight){
    if(request !== undefined && request.method === 'get_prop'){
        for(var i = 0; i < request.params.length; i++){
            var param_name = request.params[i];
            var param_value = json.result[i];
            set_prop(param_name, param_value, yeelight);
        }
    }else{
        console.log(json);
    }
}

var set_prop = function(name, value, yeelight) {
    switch (name) {
        case 'power':
            yeelight.power = value;
            break;
        case 'bright':
            yeelight.bright = value;
            break;
        case 'ct':
            yeelight.ct = value;
            break;
        case 'rgb':
            yeelight.rgb = DEC2RGB(value);
            break;
        case 'hue':
            yeelight.hue = value;
            break;
        case 'sat':
            yeelight.sat = value;
            break;
        case 'color_mode':
            yeelight.color_mode = value;
            break;
        case 'flowing':
            yeelight.flowing = value;
            break;
        case 'name':
            yeelight.name = value;
            break;
        default:
            break;
    }
}


/**
 * Calculates the rgb decimal value from a given rgb array.
 */
YeelightJS.prototype.rgb2dec = function(rgb){
    return (rgb[0] * 65536) + (rgb[1]*256) + rgb[2];
}

var DEC2RGB = function(rgbdec){
    return [
        (rgbdec >> 16) & 0xff,
        (rgbdec >> 8) & 0xff,
        rgbdec & 0xff
    ];
}

/**
 * Fetches the current state for the given yeelight.
 */
YeelightJS.prototype.getState = function(yeelight) {
    if(yeelight.connected === false && yeelight.socket === null){
        console.err(err(`Disconnected device: ${yeelight.host}`));
    }
    var request = {
        id: yeelight.id,
        method: 'get_prop',
        params: ['power','bright','ct','rgb','hue','sat','color_mode','flowing','name']
    }
    stateFetches.push(request);
    var json = JSON.stringify(request).concat('\r\n');
    yeelight.socket.write(json);
}

const options = {
    PORT: 55443
}


module.exports = YeelightJS;