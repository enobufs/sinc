/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916 at gmail.com>
 * MIT Licensed
 */

var EventEmitter = require('events').EventEmitter;
var redis = require('redis');
var _und = require('underscore');
var util = require('util');
var Channel = require('./channel').Channel;
var Mode = require('./channel').Mode;
var Logger = require('fuzelog');

// Allow passing arbitrary logger. The logger must have the following methods
// - error()
// - warn()
// - info()
// - debug()
// By default, fuzelog is used.
var setLogger = function(logger) {
    sinclog = logger;
    require('./channel').setLogger(sinclog);
};

// Set default logger (fuzelog).
var defaultLoggerCfg = {
    level: 'info',
    name: 'sinc',
    consoleLogging: true,
    colorConsoleLogging: true,
    logMessagePattern: '[%d{ISO8601}] [%p] %c - %m{1}'
};
setLogger(new Logger(defaultLoggerCfg));


////////////////////////////////////////////////////////////////////////////////
// Sinc class

function Sinc(sincId, redisPort, redisHost) {
    var self = this;
    if(!_und.isString(sincId) || sincId.length === 0) {
        throw "sinc: invalid sinc ID";
    }
    redisPort = redisPort || 6379;
    redisHost = redisHost || 'localhost';

    self._id = "sinc:" + sincId;
    self._chs = {};
    self.__defineGetter__("id", function(){ return sincId; });

    // Create redis client.
    self.cli = redis.createClient(
        redisPort,
        redisHost,
        {return_buffers:true}
    );

    self.cli.on("ready", function () {
        sinclog.info("cli: Ready");
        self.emit('ready', self);
    });
    self.cli.on("end", function (err) {
        sinclog.info("cli: connection closed");
    });
    self.cli.on("error", function (err) {
        sinclog.info("cli: Error " + err);
        self.emit('error', err, self);
    });

    // Subscriber
    self.sub = redis.createClient(
        redisPort, 
        redisHost,
        {return_buffers:true}
    );
    self.sub.on("subscribe", function (chId) {
        sinclog.info("sinc:sub: Ready: chId=" + chId);
        var ch = self._chs[chId];
        if(ch) {
            ch._onSubscribe();
        }

    });
    self.sub.on("unsubscribe", function (chId) {
        sinclog.info("sinc:sub: Closed: chId=" + chId);
        var ch = self._chs[chId];
        if(ch) {
            delete self._chs[chId];
            ch._onUnsubscribe();
        }
    });
    self.sub.on("message", self._onMessage.bind(self));
    self.sub.on("error", function (err) {
        sinclog.info("sub: Error " + err);
        self.emit('error', err, self);
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
    if(!_und.isUndefined(ch)) {
        sinclog.error('Sinc: channel "' + chId + '" already exits');
        return ch;
    }

    ch = new Channel(chId, this);
    this._chs[fullChId] = ch;
    // Subscribe this channel.
    this.sub.subscribe(fullChId);

    return ch;
};

Sinc.prototype.getNumChannels = function() {
    return _und.size(this._chs);
};

Sinc.prototype._onMessage = function(chId, msg) {
    sinclog.debug('Sinc: _onMessage called: ' + msg.length + ' bytes received');
    var ch = this._chs[chId];
    if(ch) {
        sinclog.debug('Sinc: calling ch._onMessage');
        ch._onMessage(msg);
    } else {
        sinclog.error('Sinc: error: chId=' + chId + ' not found');
    }
};

Sinc.prototype._deleteChannel = function(chId) {
    var ch = this._chs[chId];
    if(ch) {
        this.sub.unsubscribe(chId);
    } else {
        sinclog.warn('Sinc: channel "' + chId + '" does not exist');
    }
};


////////////////////////////////////////////////////////////////////////////////
// Exports
exports.create = function(sincId, redisPort, redisHost) {
    return new Sinc(sincId, redisPort, redisHost);
};
exports.setLogger = setLogger;
exports.Mode = Mode;


////////////////////////////////////////////////////////////////////////////////
// Standalone mode.
if (require.main === module) {
}

