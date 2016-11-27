'use strict';

const Server = require('./server');

module.exports = {
    createServer: (config, err) => {
        const stun = new Server(config);
        stun.on('log', (log) => {
            console.log('%s : [%s] %s', new Date(), log.level, log.message);
        });
        stun.listen();
        if (!err) console.log(`STUN server started at ${config.primary.host}:${config.primary.port} and ${config.secondary.host}:${config.secondary.port}`);
        else console.log('Error starting STUN server!');
    }
};

