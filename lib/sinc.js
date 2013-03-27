/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916@gmail.com>
 * MIT Licensed
 */

var EventEmitter = require('events').EventEmitter;
var redis = require('redis');
var _und = require('underscore');
var util = require('util');
var Channel = require('./channel').Channel;
var Log = require('fuzelog');

// Global settings.
var logConfig = {
    level: 'debug',
    name: 'sinc',
    file: __dirname + '/sinc.log',
    fileFlags: 'a',
    consoleLogging: true,
    colorConsoleLogging: true,
    logMessagePattern: '[%d{ISO8601}] [%p] %c - %m{1}'
};

var sinclog = new Log(logConfig);
require('./channel').setLogger(sinclog);

var sinc = exports = module.exports = function(sincId, redisPort, redisHost) {
    return new Sinc(sincId, redisPort, redisHost);
};

////////////////////////////////////////////////////////////////////////////////
// Sinc class

function Sinc(sincId, redisPort, redisHost) {
    var self = this;
    if(!_und.isString(sincId) || sincId.length === 0) {
        throw "sinc: invalid sinc ID";
    }
    redisPort = redisPort || 6379;
    redisHost = redisHost || 'localhost';

    self._id = sincId;
    self._chs = {};

    // Create redis client.
    self.cli = redis.createClient(
        redisPort,
        redisHost,
        {return_buffers:true}
    );

    self.cli.on("ready", function () {
        sinclog.info("cli: Ready");
        self.emit('ready', self._id);
    });
    self.cli.on("error", function (err) {
        sinclog.info("cli: Error " + err);
        self.emit('error', err, self._id);
    });

    // Subscriber
    self.sub = redis.createClient(redisPort, redisHost);
    self.sub.on("subscribe", function (chId) {
        sinclog.info("sinc:sub: Ready: chId=" + chId);
        var ch = self._chs[chId];
        if(ch) {
            ch._onSubscribe();
        }

    });
    self.sub.on("message", self._onMessage.bind(self));
    self.sub.on("error", function (err) {
        sinclog.info("sub: Error " + err);
        self.emit('error', err, self._id);
    });
}

util.inherits(Sinc, EventEmitter);

Sinc.prototype.createChannel = function(chId) {
    if(!_und.isString(chId) || chId.length === 0) {
        throw "sinc: invalid node key";
    }

    var fullChId = this._id + ':' + chId;

    // Check if the key already exists.
    var ch = this._chs[fullChId];
    if(_und.isUndefined(ch)) {
        ch = new Channel(fullChId, this);
        this._chs[fullChId] = ch;
        // Subscribe this channel.
        this.sub.subscribe(fullChId);
    }

    return ch;
};

Sinc.prototype._onMessage = function(chId, msg) {
    sinclog.debug('Sinc: _onMessage called: msg=' + msg);
    var ch = this._chs[chId];
    if(ch) {
        sinclog.debug('Sinc: calling ch._onMessage');
        ch._onMessage(msg);
    } else {
        sinclog.error('Sinc: error: chId=' + chId + ' not found');
    }
};



////////////////////////////////////////////////////////////////////////////////
// Standalone mode.
if (require.main === module) {
    // In-band object transfer
    var test1 = function() {
        var mySinc = sinc('MySinc');
        mySinc.on('ready', function(key) {
            sinclog.info('mySinc: ready: key=' + key);
        });
        mySinc.on('error', function(err, key) {
            sinclog.error('mySinc: error: ' + err + ' key=' + key);
        });

        var myChannel = mySinc.createChannel('myCh');
        myChannel.on('ready', function() {
            sinclog.info('myCh: ready.');
            var n1 = myChannel.createNode('n1');
            sinclog.info('n1: created.');
            n1.on('message', function(msg, from) {
                sinclog.info('n1 receveid msg: ' + JSON.stringify(msg));
            });
            var n2 = myChannel.createNode('n2');
            sinclog.info('n2: created.');
            n2.on('message', function(msg, from) {
                sinclog.info('n2 receveid msg: ' + JSON.stringify(msg));
            });

            sinclog.info('n1 is sending a message');
            n1.send({msg:'Hello'}, 'n2');
        });
    };

    var test2 = function() {
        var mySinc = sinc('MySinc');
        mySinc.on('ready', function(key) {
            sinclog.info('mySinc: ready: key=' + key);
        });
        mySinc.on('error', function(err, key) {
            sinclog.info('mySinc: error: ' + err + ' key=' + key);
        });

        var myChannel = mySinc.createChannel('myCh');
        myChannel.on('ready', function() {
            sinclog.info('myCh: ready.');
            var n1 = myChannel.createNode('n1');
            sinclog.info('n1: created.');
            n1.on('message', function(msg, from) {
                sinclog.info('n1 receveid ' + JSON.stringify(msg) + ' from ' + from);
            });
            var n2 = myChannel.createNode('n2');
            sinclog.info('n2: created.');
            n2.on('message', function(msg, from) {
                sinclog.info('n2 receveid ' + JSON.stringify(msg) + ' from ' + from);
            });

            sinclog.info('n1 is sending a message');
            n1.send({msg:'おはよう'}, ['n1','n2'], {outband:true});
        });
    };

    //test1();
    test2();

}

