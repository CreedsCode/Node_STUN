#!/usr/bin/env node
'use strict';

const stun = require('../index');
var serverAddr = "127.0.0.1";

var program = require('commander');

program
.version(require('../package').version)
.option('-s, --server [host]', 'STUN server address (e.g. 24.1.2.3')
.parse(process.argv);

if (program.server) {
    serverAddr = program.server;
}


const client = stun.createClient();
client.setServerAddr(serverAddr);
client.start(function (result) {
    const mapped = client.getMappedAddr();
    console.log([
        "Complete(" + result + "): ",
        (client.isNatted()?"Natted":"Open"),
        " NB=" + client.getNB(),
        " EF=" + client.getEF(),
        " (" + client.getNatType() + ")",
        " mapped=" + mapped.address + ":" + mapped.port,
        " rtt=" + client.getRtt()
    ].join(''));

    client.close(function () {
        console.log("All sockets closed.");
    });
});

