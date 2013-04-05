# sinc


Simple Inter-Node (cluster) Communication, powerd by Redis.

## Installation
(TODO)

## Features
* Real-time messaging between (server/cluster) nodes via Redis.
* Simple API - easy to use!
* Supports string, JSON object and binary.
* Messaging types:
   * Unicat
   * Multicast
   * Broadcast
* Support of multiple 'channels' - a logical communication domain between nodes.

## Usage

### Create my sinc object
    var sinc = require('sinc');
    var mySinc = sinc('sinc for my app');

### Create a channel

    var myCh = mySinc.createChannel('my channel');
    
### Create a node, then send & receive messages

    var n01 = myCh.createNode('node 01');
    n01.on('message', function(node, msg, from) {
    	// Handle received message
    })
    n01.send('Hello, World!', 'node 02');

## API

### Module

* [sinc(sincId, [redisPort], [redisHost])](#sinc)
* [setLogger(logger)](#setLogger)

### Class: Sinc (extends events.EventEmitter)

* [createChannel(chId)](#createChannel)
* [getNumChannels()](#getNumChannels)
* [Event: 'ready'](#Sinc_Event_ready)
* [Event: 'error'](#Sinc_Event_error)

### Class: Channel (extends events.EventEmitter)

* [createNode(nodeId)](#createNode)
* [close()](#Channel_close)
* [getNumNodes()](#getNumNodes)
* [Event: 'ready'](#Channel_Event_ready)
* [Event: 'close'](#Channel_Event_close)


### Class: Node (extends events.EventEmitter)

* [send(msg, to, [options])](#send)
* [broadcast(msg, [options])](#broadcast)
* [close()](#Node_close)
* [Event: 'message'](#Node_Event_message)


## Module Method

<a name="sinc" />
### sinc(sincId, [redisPort], [redisHost])

<a name="setLogger" />
### setLogger(logger)

## Class: Sinc

<a name="createChannel" />
### createChannel(chId)

<a name="getNumChannels" />
### getNumChannels()

<a name="Sinc_Event_ready" />
### Event: 'ready'
Callback function signature: function() {}

<a name="Sinc_Event_error" />
### Event: 'error'
Callback function signature: function(err) {}

## Class: Channel

<a name="createNode" />
### createNode(nodeId)

<a name="Channel_close" />
### close()

<a name="getNumNodes" />
### getNumNodes()

<a name="Channel_Event_ready" />
### Event: 'ready'

<a name="Channel_Event_close" />
### Event: 'close'

## Class: Node

<a name="send" />
### send(msg, to, [options])

<a name="broadcast" />
### broadcast(msg, [options])

<a name="Node_close" />
### close()

<a name="Node_Event_message" />
### Event: 'message'



<!-- Highlight syntax for Mou.app, insert at the bottom of the markdown document  -->
 
<script src="http://yandex.st/highlightjs/7.3/highlight.min.js"></script>
<link rel="stylesheet" href="http://yandex.st/highlightjs/7.3/styles/github.min.css">
<script>
  hljs.initHighlightingOnLoad();
</script>