# sinc


Simple Inter-Node (cluster) Communication, powerd by Redis.

## Installation
(TODO)

## Features
* Real-time messaging between (server/cluster) nodes via Redis.
* Simple API - easy to use!
* Supports string, JSON object and binary.
* Messaging types:
   * Unicast
   * Multicast
   * Broadcast
* Transfer Modes:
   * Inband: Deliver message inband (sending user data over redis pub-sub)
   * Outband: Deliver message outband (good for unicasting large data)
   * Auto: (not implemented yet)
* Support of multiple 'channels' - a logical communication domain between nodes.

## Usage

### Create my sinc object

    var sinc = require('sinc');
    var mySinc = sinc.create('sinc for my app');

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

* [create(sincId, [redisPort], [redisHost])](#create)
* [setLogger(logger)](#setLogger)
* [Mode](#mode)

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


## Module

<a name="create" />
### create(sincId, [redisPort], [redisHost])
Creates a Sinc object.

* sincId {string} - Sinc object ID. Typically an unique string that represents your application.
* redisPort {number} - Redis port number. Defaults to 6379.
* redisHost {string} - Redis host name. Defaults to 'localhost'

<a name="setLogger" />
### setLogger(logger)
Set custom logger. The logger object must have the following method:

* error()
* warn()
* info()
* debug()

By default, sinc module uses 'fuzelog'.

### Mode {object}
Transfer mode.

* Inband: 0   - Default. Data is sent using redis publish.
* Outband: 1  - Data is stored in redis first then notify receiver of the data using pubsub.
* Auto: 2     - Let sinc decide which mode should use. (not implemented yet)


## Class: Sinc

<a name="createChannel" />
### createChannel(chId)
Creates a channel object.

* chId {string} - A unique channel ID within the sinc ID.

<a name="getNumChannels" />
### getNumChannels()
Gets the number of channels currently active.

<a name="Sinc_Event_ready" />
### Event: 'ready'
Notified when the sinc object become ready.

CALLBACK: function( ) { }

<a name="Sinc_Event_error" />
### Event: 'error'
CALLBACK: function(err) { }

* err {string} - A text that describes the error. 

## Class: Channel

<a name="createNode" />
### createNode(nodeId)
Creates a node (a communication endpoint) object.

* nodeId {string} - A unique node ID within the channel ID.

<a name="Channel_close" />
### close()
Close this channel.

<a name="getNumNodes" />
### getNumNodes()
Returns the number of nodes on this channel.

<a name="Channel_Event_ready" />
### Event: 'ready'
Notified when the channel has become ready to use.

CALLBACK: function( ) { }

<a name="Channel_Event_close" />
### Event: 'close'
Notified when this channel has been closed.

CALLBACK: function( ) { }

## Class: Node

<a name="send" />
### send(msg, to, [options])
Sends a message to a specified destiation, or a set of destinations.

* msg {string|object|Buffer} - A message to send. When the type is 'object', it assumes the object is a JSON object.
* to {string|array} - Destination node(s).
* options {object}:
   * mode {number} - Transfer mode. Mode.Inband by default.

<a name="broadcast" />
### broadcast(msg, [options])
Broadcasts a message.

* msg {string|object|Buffer} - A message to send. When the type is 'object', it assumes the object is a JSON object.
* options {object}:
   * mode {number} - Transfer mode. Mode.Inband by default.
   * loopback {boolean} - Whether to loopback the broadcasted message.


<a name="Node_close" />
### close()
Closes this node.

<a name="Node_Event_message" />
### Event: 'message'
Notified when a message has been received on this node.

CALLBACK: function(node, msg, from) { }


<!-- Highlight syntax for Mou.app, insert at the bottom of the markdown document  -->
 
<script src="http://yandex.st/highlightjs/7.3/highlight.min.js"></script>
<link rel="stylesheet" href="http://yandex.st/highlightjs/7.3/styles/github.min.css">
<script>
  hljs.initHighlightingOnLoad();
</script>
