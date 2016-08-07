'use strict';

const dgram = require('dgram'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	Message = require('./message'),
	defaults = require('../config').stun.defaults;

/**
 * Server class.
 * @class
 * @param {object} config Config object.
 * @param {object} config.primary Primary address
 * @param {string} config.primary.host Primary host name
 * @param {string|number} config.primary.port Primary port number
 * @param {object} config.secondary Secondary address
 * @param {string} config.secondary.host Secondary host name
 * @param {string|number} config.secondary.port Secondary port number
 */
function Server(config) {
	function Check(val) {
		return (val == null || val == '')
	}
	if (Check(config.primary.host) || Check(config.secondary.host) || Check(config.primary.port) || Check(config.secondary.port)) {
		console.log("No STUN Configuration Found - reverting to defaults");
		this._addr0 = defaults.primary.host;
		this._addr1 = defaults.secondary.host;
		this._port0 = parseInt(defaults.primary.port);
		this._port1 = parseInt(defaults.secondary.port);
	} else {
		console.log("STUN Configuration Found");
		this._addr0 = config.primary.host;
		this._addr1 = config.secondary.host;
		this._port0 = parseInt(config.primary.port);
		this._port1 = parseInt(config.secondary.port);
	}
	this._sockets = [];
	this._stats = {
		numRcvd: 0,
		numSent: 0,
		numMalformed: 0,
		numUnsupported: 0
	};
	this._logger = require('./logger').create(this);
}

util.inherits(Server, EventEmitter);

/** @private */
Server.prototype._onListening = (sid) => {
	let sin = this._sockets[sid].address();
	this._logger.info("soc[" + sid + "] listening on " + sin.address + ":" + sin.port);
};

Server.prototype._onReceived = (sid, msg, rinfo) => {
	this._logger.debug("soc[" + sid + "] received from " + rinfo.address + ":" + rinfo.port);

	var stunmsg = new Message();
	var fid = sid; // source socket ID for response

	this._stats.numRcvd++;

	try {
		stunmsg.deserialize(msg);
	}
	catch (e) {
		this._stats.numMalformed++;
		this._logger.warn("Error: " + e.message);
		return;
	}

	// We are only interested in binding request.
	if (stunmsg.getType() != 'breq') {
		this._stats.numUnsupported++;
		return;
	}

	let val;

	// Modify source socket ID (fid) based on
	// CHANGE-REQUEST attribute.
	val = stunmsg.getAttribute('changeReq');
	if (val != undefined) {
		if (val.changeIp) {
			fid ^= 0x2;
		}
		if (val.changePort) {
			fid ^= 0x1;
		}
	}

	// Check if it has timestamp attribute.
	let txTs,
		rcvdAt = Date.now();
	val = stunmsg.getAttribute('timestamp');
	if (val != undefined) {
		txTs = val.timestamp;
	}

	//this._logger.debug("sid=" + sid + " fid=" + fid);

	try {
		// Initialize the message object to reuse.
		// The init() does not reset transaction ID.
		stunmsg.init();
		stunmsg.setType('bres');

		// Add mapped address.
		stunmsg.addAttribute('mappedAddr', {
			'family': 'ipv4',
			'port': rinfo.port,
			'addr': rinfo.address
		});

		// Offer CHANGED-ADDRESS only when this._addr1 is defined.
		if (this._addr1 != undefined) {
			let chAddr = (sid & 0x2) ? this._addr0 : this._addr1,
				chPort = (sid & 0x1) ? this._port0 : this._port1;

			stunmsg.addAttribute('changedAddr', {
				'family': 'ipv4',
				'port': chPort,
				'addr': chAddr
			});
		}

		let soc = this._sockets[fid];

		// Add source address.
		stunmsg.addAttribute('sourceAddr', {
			'family': 'ipv4',
			'port': soc.address().port,
			'addr': soc.address().address
		});

		// Add timestamp if existed in the request.
		if (txTs) {
			stunmsg.addAttribute('timestamp', {
				'respDelay': ((Date.now() - rcvdAt) & 0xffff),
				'timestamp': txTs
			});
		}

		let resp = stunmsg.serialize();
		if (!soc) {
			throw new Error("Invalid from ID: " + fid);
		}

		this._logger.debug('soc[' + fid + '] sending ' + resp.length + ' bytes to ' + rinfo.address + ':' + rinfo.port);
		soc.send(resp,
			0,
			resp.length,
			rinfo.port,
			rinfo.address);
	} catch (e) {
		this._stats.numMalformed++;
		this._logger.debug("Error: " + e.message);
	}

	this._stats.numSent++;
};

Server.prototype._getPort = (sid) => {
	return (sid & 1) ? this._port1 : this._port0;
};

Server.prototype._getAddr = (sid)=> {
	return (sid & 2) ? this._addr1 : this._addr0;
};

/**
 * Starts listening to STUN requests from clients.
 * @throws {Error} Server address undefined.
 */
Server.prototype.listen = () => {
	const self = this;

	// Sanity check
	if (!this._addr0) {
		console.log("No STUN Configuration Found - reverting to default primary host");
		this._addr0 = defaults.primary.host;
	}
	if (!this._addr1) {
		console.log("No STUN Configuration Found - reverting to default secondary host");
		this._addr1 = defaults.secondary.host;
	}
	if (!this._port0) {
		console.log("No STUN Configuration Found - reverting to default primary port");
		this._port0 = defaults.primary.port;
	}
	if (!this._port1) {
		console.log("No STUN Configuration Found - reverting to default secondary port");
		this._port1 = defaults.secondary.port;
		console.log(defaults.secondary.port);
		console.log(this._addr1)
	}

	if (!this._addr0 || !this._addr1) {
		throw new Error("Address undefined");
	}

	if (!this._port0 || !this._port1) {
		throw new Error("Port undefined");
	}

	for (var i = 0; i < 4; ++i) {
		// Create socket and add it to socket array.
		var soc = dgram.createSocket("udp4");
		this._sockets.push(soc);

		switch (i) {
			case 0:
				soc.on("listening", () => {
					self._onListening(0);
				});
				soc.on("message", (msg, rinfo) => {
					self._onReceived(0, msg, rinfo);
				});
				break;
			case 1:
				soc.on("listening", () => {
					self._onListening(1);
				});
				soc.on("message", function (msg, rinfo) {
					self._onReceived(1, msg, rinfo);
				});
				break;
			case 2:
				soc.on("listening", () => {
					self._onListening(2);
				});
				soc.on("message", (msg, rinfo) => {
					self._onReceived(2, msg, rinfo);
				});
				break;
			case 3:
				soc.on("listening", () => {
					self._onListening(3);
				});
				soc.on("message", (msg, rinfo) => {
					self._onReceived(3, msg, rinfo);
				});
				break;
			default:
				throw new RangeError("Out of socket array");
		}

		// Start listening.
		soc.bind(self._getPort(i), self._getAddr(i));
	}
};

/**
 * Closes the STUN server.
 */
Server.prototype.close = () => {
	while (this._sockets.length > 0) {
		let soc = this._sockets.shift(),
			sin = soc.address();
		this._logger.info("Closing socket on " + sin.address + ":" + sin.port);
		soc.close();
	}
};

module.exports = Server;
