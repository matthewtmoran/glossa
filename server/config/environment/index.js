'use strict';

var path = require('path');
var _ = require('lodash');
process.env.NODE_ENV = process.env.NODE_ENV || 'dev-es6';
function requiredProcessEnv(name) {
    if (!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}


// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Server port
    port: process.env.PORT || 9000,

    // Server IP
    ip: process.env.IP || '0.0.0.0',

    // Should we populate the DB with sample data?
    seedDB: false,
    localDev: process.env.LOCAL || false,
    secondInstance: process.env.SECOND_INSTANCE || false,

    // List of user roles
    userRoles: ['guest', 'user', 'admin'],
    dataRootPath: process.env.SECOND_INSTANCE ? '/Glossa2' : 'Glossa',
};
// Export the config object based on the NODE_ENV
// ==============================================

module.exports = _.merge(
    all,
    require('./' + process.env.NODE_ENV + '.js') || {});
