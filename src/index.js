const Socket = require('net').Socket;
const EventEmitter = require('events').EventEmitter;
const PORT = 55443;


/**
 * Yeelight device instance.
 */
class Yeelight extends EventEmitter {


    /**
     * Yeelight instance constructor.
     * @param {string} host The host ip of the yeelight device.
     */
    constructor(host){
        super();
        this.host = host;
        this.connected = false;
        this.socket = Socket();
    }


    /**
     * Connects this yeelight instance to the yeelight device.
     */
    _connect(){
        this.socket.connect({port: PORT, host: this.host}, () => {
            this.connected = true;
        });
        this.socket.on('close', (err) => {
            this.emit('disconnected', {
                host: this.host,
                err: err,
                message: 'Yeelight has been disconnected'
            });
            this.connected = false;
        });
    }

    /**
     * Returns a random id beetween 1 and 1000.
     */
    _rndmId(){
        return Math.round(Math.random() * 1000);
    }

    /**
     * Sends the request to the yeelight device.
     * @param {object} request 
     */
    async _postRequest(request){
        if(!this.connected){
            this._connect();
        }
        return new Promise((resolve, reject) => {
            request.id = this._rndmId();
            this.socket.write(JSON.stringify(request) + '\r\n');
            this.socket.on('error', (err) => {
                reject(err);
            });
            this.socket.on('data', (data) => {
                let response = JSON.parse(data.toString());
                if(response.id === request.id){
                    resolve(response);
                }
            });
        });
    }
    /**
     * Fetches single or multiple props of the yeelight device.
     * @param {string} prop A property as string.
     * @param  {Array<string>} props Array of properties as strings.
     */
    
    fetchProperty(prop, ...props){
        let args = [prop, ...props];
        return this._postRequest({
            method: 'get_prop',
            params: args
        });
    }

    /**
     * Maps a rgb array value  to its decimal representation.
     * @param {Array<number>} rgb The rgb value array.
     */
    RGB2DEC(rgb){
        return (rgb[0] * 65536) + (rgb[1]*256) + rgb[2];
    }


    /**
     * Maps a rgb decimal value to its array representation.
     * @param {number} rgbdec The decimal rgb value.
     */
    DEC2RGB(rgbdec){
        return [
            (rgbdec >> 16) & 0xff,
            (rgbdec >> 8) & 0xff,
            rgbdec & 0xff
        ];
    }

    /**
     * Sets rgb value of the yeelight device.
     * @param {Array<number} rgb The rgb array value. [red, green, blue].
     */
    setRGB(rgb){
        let rgb_dec = this.RGB2DEC(rgb);
        let request = {
            method: 'set_rgb',
            params: [rgb_dec, 'smooth', 500]
        };
        this._postRequest(request);
        this.rgb = rgb_dec;
    }

    /**
     * Turns the yeelight device on or off.
     * @param {string} power Whether the device should be turned 'on' or 'off'.
     */
    setPower(power){
        let request = {
            method: 'set_power',
            params: [power, 'smooth', 500]
        };
        this._postRequest(request);
        this.power = power;
    }

    /**
     * Adjusts the brightness of the yeelight device.
     * @param {number} brightness The brightness as value beetween 0 and 100.
     */
    setBrightness(brightness){
        let request = {
            method: 'set_bright',
            params: [brightness, 'smooth', 500]
        };
        this._postRequest(request);
        this.brightness = brightness;
    }


    /**
     * Fetches the current yeelight device state.
     */
    getCurrentState(){
        return this.fetchProperty('power','bright', 'ct', 'rgb', 'hue', 'sat', 'color_mode', 'flowing', 'name');  
    }
}


module.exports = Yeelight;