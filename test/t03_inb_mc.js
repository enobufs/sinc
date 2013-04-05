/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916 at gmail.com>
 * MIT Licensed
 */

var sinc = require('../lib/sinc');
var assert = require('assert');
var Log = require('fuzelog');

var SincID = 't03_inb_mc';
var RedisPort = 6379;
var RedisHost = 'localhost';
var mySinc;

// Global settings.
var logcfg = {
    level: 'debug',
    name: SincID,
    consoleLogging: true,
    colorConsoleLogging: true,
    logMessagePattern: '[%d{ISO8601}] [%p] %c - %m{1}'
};

var testlog = new Log(logcfg);

suite('t03_inb_mc', function(){
    suiteSetup(function(done) {
        mySinc = sinc.create(SincID, RedisPort, RedisHost);
        mySinc.on('ready', function(key) {
            testlog.info('mySinc: ready: key=' + key);
        });
        mySinc.on('error', function(err, key) {
            testlog.error('mySinc: error: ' + err + ' key=' + key);
            done(err);
        });
        done();
    });

    test('Send string', function(done) {
        var myCh = mySinc.createChannel('myCh');
        var orgMsg = 'Hello, World!';
        var nodes = [];
        var totalRcvd = 0;
        var i;
        var onReceived = function(node, msg, from) {
            node._nRcvd++;
            totalRcvd++;
            testlog.info(node.id + ' received msg: ' + msg);
            assert.equal(msg, orgMsg, 'Data mismatch');
            if(totalRcvd === 2) {
                assert(nodes[1]._nRcvd === 1 && nodes[3]._nRcvd === 1);
                for(i = 0; i < nodes.length; ++i) {
                    nodes[i].close();
                }
                testlog.info('all nodes closed');
                assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                myCh.close();
            }
        };
        myCh.on('ready', function() {
            testlog.info('myCh: ready.');
            var id;
            var n;
            for(i = 0; i < 4; ++i) {
                id = 'n' + i;
                testlog.info('creating node ' + id);
                n = myCh.createNode(id);
                n._nRcvd = 0;
                nodes.push(n);
                n.on('message', function(n, msg, from) {
                    onReceived(n, msg, from);
                });
            }

            testlog.info('n0 is sending a message');
            nodes[0].send(orgMsg, [nodes[1].id, nodes[3].id]);
        });
        myCh.on('close', function() {
            done();
        });
    });

    test('Send object', function(done) {
        var myCh = mySinc.createChannel('myCh');
        var orgMsg = { msg:'Hello, World!' };
        var nodes = [];
        var totalRcvd = 0;
        var i;
        var onReceived = function(node, msg, from) {
            node._nRcvd++;
            totalRcvd++;
            testlog.info(node.id + ' received msg: ' + msg);
            assert.deepEqual(msg, orgMsg, 'Data mismatch');
            if(totalRcvd === 2) {
                assert(nodes[1]._nRcvd === 1 && nodes[3]._nRcvd === 1);
                for(i = 0; i < nodes.length; ++i) {
                    nodes[i].close();
                }
                testlog.info('all nodes closed');
                assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                myCh.close();
            }
        };
        myCh.on('ready', function() {
            testlog.info('myCh: ready.');
            var id;
            var n;
            for(i = 0; i < 4; ++i) {
                id = 'n' + i;
                testlog.info('creating node ' + id);
                n = myCh.createNode(id);
                n._nRcvd = 0;
                nodes.push(n);
                n.on('message', function(n, msg, from) {
                    onReceived(n, msg, from);
                });
            }

            testlog.info('n0 is sending a message');
            nodes[0].send(orgMsg, [nodes[1].id, nodes[3].id]);
        });
        myCh.on('close', function() {
            done();
        });
    });

    test('Send binary (Buffer)', function(done) {
        var i;
        var myCh = mySinc.createChannel('myCh');
        var orgMsg = new Buffer(256);
        for(i = 0; i < orgMsg.length; ++i) {
            orgMsg.writeUInt8((i+128) & 0xff, i);
        }
        var nodes = [];
        var totalRcvd = 0;
        var i;
        var onReceived = function(node, msg, from) {
            node._nRcvd++;
            totalRcvd++;
            testlog.info(node.id + ' received ' + msg.length + ' bytes');
            assert(Buffer.isBuffer(msg));
            assert(msg.length === orgMsg.length);
            for(i = 0; i < msg.length; ++i) {
                assert(msg.readUInt8(i) === orgMsg.readUInt8(i));
            }

            if(totalRcvd === 2) {
                assert(nodes[1]._nRcvd === 1 && nodes[3]._nRcvd === 1);
                for(i = 0; i < nodes.length; ++i) {
                    nodes[i].close();
                }
                testlog.info('all nodes closed');
                assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                myCh.close();
            }
        };
        myCh.on('ready', function() {
            testlog.info('myCh: ready.');
            var id;
            var n;
            for(i = 0; i < 4; ++i) {
                id = 'n' + i;
                testlog.info('creating node ' + id);
                n = myCh.createNode(id);
                n._nRcvd = 0;
                nodes.push(n);
                n.on('message', function(n, msg, from) {
                    onReceived(n, msg, from);
                });
            }

            testlog.info('n0 is sending a message');
            nodes[0].send(orgMsg, [nodes[1].id, nodes[3].id]);
        });
        myCh.on('close', function() {
            done();
        });
    });

    suiteTeardown(function(){
    });
});
