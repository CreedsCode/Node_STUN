module.exports = {
    server: {
        port: process.env.PORT || 8888
    },
    stun: {
        primary: {
            host: '127.0.0.1',
            port: 3478
        },
        secondary: {
            host: '127.0.0.2',
            port: 3479
        },
        defaults: {
            primary: {
                host: '127.0.0.1',
                port: 3478
            },
            secondary: {
                host: '127.0.0.2',
                port: 3479
            }
        }
    }
};
