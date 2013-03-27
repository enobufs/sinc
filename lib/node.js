/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916@gmail.com>
 * MIT Licensed
 */

var EventEmitter = require('events').EventEmitter;
var redis = require('redis');
var _und = require('underscore');
var util = require('util');


var sinclog = null;

////////////////////////////////////////////////////////////////////////////////
// Node class

function Node(nodeId, ch) {
    if(!_und.isString(nodeId) || nodeId.length === 0) {
        throw "sinc: invalid node ID";
    }

    this._id = nodeId;
    this._ch = ch;
}

util.inherits(Node, EventEmitter);

Node.prototype.send = function(msg, to, options) {
    if(!_und.isString(to)) {
        if(!_und.isArray(to)) {
            sinclog.error('error: to must be either of string or of array of strings');
            return;
        }
        
        for(var i = 0; i < to.length; ++i) {
            if(!_und.isString(to[i])) {
                sinclog.error('error: array must contain only strings');
                return;
            }
        }
    }

    var hdr = {
        to: to,
        from: this._id,
    };

    // Determin loopback option for '*'(broadcast)
    if(hdr.to === '*') {
        hdr['lb'] = options.loopback? true:false;
    }

    this._ch.send(hdr, msg, options);
};

Node.prototype.broadcast = function(msg, options) {
    this.send(msg, "*", options);
};

Node.prototype._onMessage = function(msg, from) {
    this.emit('message', msg, from);
};



////////////////////////////////////////////////////////////////////////////////

exports.Node = Node;
exports.setLogger = function(log) {
    sinclog = log;
};

////////////////////////////////////////////////////////////////////////////////
// Standalone mode.
if (require.main === module) {
}

