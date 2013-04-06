/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916 at gmail.com>
 * MIT Licensed
 */

var sinc = require('../lib/sinc');
var assert = require('assert');
var Log = require('fuzelog');

var SincID = 't05_inb_bc';
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

suite('t05_inb_bc', function(){
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

    test('Broadcast string', function(done) {
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
            if(totalRcvd === 3) {
                // Evaluate result in 100 msec.
                // Doing this to make sure there is not
                // more to receive. (looback:false by default)
                setTimeout(function() {
                    assert(nodes[0]._nRcvd === 0);
                    assert(nodes[1]._nRcvd === 1);
                    assert(nodes[2]._nRcvd === 1);
                    assert(nodes[3]._nRcvd === 1);
                    for(i = 0; i < nodes.length; ++i) {
                        nodes[i].close();
                    }
                    testlog.info('all nodes closed');
                    assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                    myCh.close();
                }, 100);
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
                }.bind(this, n));
            }

            testlog.info('n0 is broadcasting a message');
            nodes[0].broadcast(orgMsg);
        });
        myCh.on('close', function() {
            done();
        });
    });

    test('Broadcast string with loopback enabled', function(done) {
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
            if(totalRcvd === 4) {
                assert(nodes[0]._nRcvd === 1);
                assert(nodes[1]._nRcvd === 1);
                assert(nodes[2]._nRcvd === 1);
                assert(nodes[3]._nRcvd === 1);
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
                }.bind(this, n));
            }

            testlog.info('n0 is broadcasting a message');
            nodes[0].broadcast(orgMsg, {loopback:true});
        });
        myCh.on('close', function() {
            done();
        });
    });

    suiteTeardown(function(){
    });
});
