/*!
 * sinc
 * Copyright (c) 2013 enobufs <yt0916 at gmail.com>
 * MIT Licensed
 */

var sinc = require('../lib/sinc');
var assert = require('assert');
var Log = require('fuzelog');

var SincID = 't02_outband';
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

suite('t02_outband', function(){
    suiteSetup(function(done) {
        mySinc = sinc(SincID, RedisPort, RedisHost);
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
        myCh.on('ready', function() {
            testlog.info('myCh: ready.');
            var n1 = myCh.createNode('n1');
            testlog.info('n1: created.');
            n1.on('message', function(n, msg, from) {
                testlog.info('n1 receveid msg: ' + msg);
                done('Unexpected data receiption');
            });
            var n2 = myCh.createNode('n2');
            testlog.info('n2: created.');
            n2.on('message', function(n, msg, from) {
                testlog.info('n2 receveid msg: ' + msg);
                assert.equal(msg, orgMsg, 'Data mismatch');
                n1.close();
                n2.close();
                testlog.info('all nodes closed');
                assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                myCh.close();
            });

            testlog.info('n1 is sending a message');
            n1.send(orgMsg, 'n2', { outband:true });
        });
        myCh.on('close', function() {
            done();
        });
    });

    test('Send object', function(done) {
        var myCh = mySinc.createChannel('myCh');
        var orgMsg = { msg:'Hello, World!' };
        myCh.on('ready', function() {
            testlog.info('myCh: ready.');
            var n1 = myCh.createNode('n1');
            testlog.info('n1: created.');
            n1.on('message', function(n, msg, from) {
                testlog.info('n1 receveid msg: ' + msg);
                done('Unexpected data receiption');
            });
            var n2 = myCh.createNode('n2');
            testlog.info('n2: created.');
            n2.on('message', function(n, msg, from) {
                testlog.info('n2 receveid msg: ' + msg);
                assert.deepEqual(msg, orgMsg, 'Data mismatch');
                n1.close();
                n2.close();
                testlog.info('all nodes closed');
                assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                myCh.close();
            });

            testlog.info('n1 is sending a message');
            n1.send(orgMsg, 'n2', { outband:true });
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
        myCh.on('ready', function() {
            testlog.info('myCh: ready.');
            var n1 = myCh.createNode('n1');
            testlog.info('n1: created.');
            n1.on('message', function(n, msg, from) {
                testlog.info('n1 receveid msg: ' + msg);
                done('Unexpected data receiption');
            });
            var n2 = myCh.createNode('n2');
            testlog.info('n2: created.');
            n2.on('message', function(n, msg, from) {
                testlog.info('n2 receveid ' + msg.length + ' bytes');
                assert(msg instanceof Buffer);
                assert(msg.length === orgMsg.length);
                for(i = 0; i < msg.length; ++i) {
                    assert(msg.readUInt8(i) === orgMsg.readUInt8(i));
                }
                n1.close();
                n2.close();
                testlog.info('all nodes closed');
                assert((myCh.getNumNodes() === 0), 'Unexpect node count');
                myCh.close();
            });

            testlog.info('n1 is sending a message');
            n1.send(orgMsg, 'n2', { outband:true });
        });
        myCh.on('close', function() {
            done();
        });
    });

    suiteTeardown(function(){
    });
});
