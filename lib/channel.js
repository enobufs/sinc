/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916@gmail.com>
 * MIT Licensed
 */

var EventEmitter = require('events').EventEmitter;
var redis = require('redis');
var _und = require('underscore');
var util = require('util');
var uuid = require('node-uuid');
var Node = require('./node').Node;


var sinclog = null;

////////////////////////////////////////////////////////////////////////////////
// Channel class

function Channel(chId, sinc) {
    if(!_und.isString(chId) || chId.length === 0) {
        throw "sinc: invalid channel ID";
    }

    this._chId = chId;
    this._sinc = sinc;
    this._nodes = {};
}

util.inherits(Channel, EventEmitter);

Channel.prototype.createNode = function(nodeId) {
    if(!_und.isString(nodeId) || nodeId.length === 0) {
        throw "sinc: invalid node key";
    }

    // Check if the key already exists.
    var node = this._nodes.nodeId;
    if(!_und.isUndefined(node)) {
        return node;
    }

    node = new Node(nodeId, this);
    this._nodes[nodeId] = node;
    return node;
};

Channel.prototype.send = function(hdr, msg, options) {
    sinclog.debug('Channel: send() called.');
    var self = this;
    var bMsg;

    // Determine msg type
    if(typeof msg === 'object') {
        if(!(msg instanceof Buffer)) {
            bMsg = new Buffer(JSON.stringify(msg));
            hdr.type = 'object';
        } else {
            hdr.type = 'binary';
            bMsg = msg;
        }
    } else {
        hdr.type = 'string';
        bMsg = new Buffer(msg);
    }

    if(options && options.outband) {
        hdr.ref = self._getUniqueKey();
        sinclog.debug('Channel: hdr.ref=' + hdr.ref);
        self._sinc.cli.set(hdr.ref, bMsg, function(err) {
            if(err) {
                sinclog.error('Channel: failed to write data on hdr.ref ' + hdr.ref);
                return;
            }
            sinclog.debug('Channel: publishing (outband): ', bMsg);
            var bHdr = new Buffer(JSON.stringify(hdr));
            var buf = self._packMessage(hdr);
            if(!buf) {
                return;
            }
            self._sinc.cli.publish(self._chId, buf);
        });
        self._sinc.cli.expire(hdr.ref, 10);
        return;
    }

    sinclog.debug('Channel: publishing ...');
    var buf = self._packMessage(hdr, bMsg);
    if(!buf) {
        return;
    }
    self._sinc.cli.publish(self._chId, buf);
    sinclog.debug('Channel: published! buf:', buf);
};

Channel.prototype._onSubscribe = function() {
    this.emit('ready', this._chId);
};

Channel.prototype._onMessage = function(msg) {
    sinclog.debug('Channel: _onMessage called: msg=' + msg);
    var self = this;
    // Assume msg is binary.
    var buf = new Buffer(msg, 'binary');
    if(buf.length < 4) {
        sinclog.error('Channel: message too short: len=' + buf.length);
        return;
    }
    var len = buf.readUInt32BE(0);
    if(len > buf.length) {
        sinclog.error('Channel: invalid length 1: len=' + len);
        return;
    }
    var off = 4;
    try {
        var hdr = JSON.parse(buf.toString('utf8', off, off+len));
    } catch(e) {
        sinclog.error('error: failed to parse message');
        return;
    }
    off += len;

    sinclog.debug('Channel: hdr:', hdr);

    var nodes = [];
    if(_und.isString(hdr.to)) {
        if(hdr.to === "*") {
            if(hdr.lb) {
                nodes = _und.toArray(self._nodes);
            } else {
                _und.each(self._nodes, function(node, id) {
                    if(id !== hdr.from) {
                        nodes.push(node);
                    }
                });
            }
        } else {
            var node = self._nodes[hdr.to];
            if(node) {
                nodes.push(node)
            }
        }
    } else if(_und.isArray(hdr.to)) {
        _und.each(hdr.to, function(to) {
            var node = self._nodes[to];
            if(node) {
                nodes.push(node)
            }
        });
    }

    sinclog.debug('num receivers: ' + nodes.length);
    if(!nodes.length) {
        return;
    }

    var body = null;

    if(hdr.ref) {
        self._sinc.cli.get(hdr.ref, function(err, data) {
            if(err) {
                sinclog.error('error: failed read data for key ' + hdr.ref);
                return;
            }
            if(hdr.type === 'object') {
                try {
                    body = JSON.parse(data.toString());
                } catch(e) {
                    sinclog.error('error: failed to parse data');
                    return;
                }
            } else if (hdr.type === 'binary') {
                body = new Buffer(data, 'binary');
            } else {
                body = data.toString();
            }
            _und.each(nodes, function(node) {
                node._onMessage(body, hdr.from);
            });
        });
        return;
    }

    if(buf.length >= off + 4) {
        len = buf.readUInt32BE(off);
        off += 4;
        if(len > buf.length - off) {
            sinclog.error('Channel: invalid length 2: len=' + len);
            return;
        }

        if (hdr.type === 'binary') {
            body = buf.slice(off, off+len);
        } else {
            body = buf.toString('utf8', off, off+len);
            if(hdr.type === 'object') {
                try {
                    body = JSON.parse(body);
                } catch(e) {
                    sinclog.error('error: failed to parse data');
                    return;
                }
            }
        }
    }

    _und.each(nodes, function(node) {
        node._onMessage(body, hdr.from);
    });
};

Channel.prototype._getUniqueKey = function(msg) {
    return 'sinc:' + uuid.v4(null, new Buffer(16)).toString('base64');
};

Channel.prototype._packMessage = function(hdr, msg) {
    // hdr must always be of type object
    if(typeof hdr !== 'object' || (hdr instanceof Buffer)) {
        sinclog.error('error: failed to pack message');
        return null;
    }
    // msg must always be of type Buffer
    if(!_und.isUndefined(msg) && !(hdr instanceof Buffer)) {
        sinclog.error('error: failed to pack message');
        return null;
    }
    var bHdr = new Buffer(JSON.stringify(hdr));
    var buf;
    if(_und.isUndefined(msg)) {
        buf = new Buffer(4 + bHdr.length);
    } else {
        buf = new Buffer(8 + bHdr.length + msg.length);
    }
    buf.writeUInt32BE(bHdr.length, 0);
    bHdr.copy(buf, 4);
    if(!_und.isUndefined(msg)) {
        buf.writeUInt32BE(msg.length, 4 + bHdr.length);
        msg.copy(buf, 8 + bHdr.length);
    }
    return buf;
};

////////////////////////////////////////////////////////////////////////////////

exports.Channel = Channel;
exports.setLogger = function(log) {
    sinclog = log;
    require('./node').setLogger(log);
};

////////////////////////////////////////////////////////////////////////////////
// Standalone mode.
if (require.main === module) {
}

