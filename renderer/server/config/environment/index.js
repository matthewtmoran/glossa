import path from 'path';
import * as _ from "lodash"
const {app} = require('electron').remote;

window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'dev-es6';
function requiredProcessEnv(name) {
    if (!window.process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return window.process.env[name];
}


// All configurations will extend these options
// ============================================
let all = {
    env: window.process.env.NODE_ENV,

    // Root path of server
    root: app.getAppPath(),

    // Server port
    port: window.process.env.PORT || 9000,

    // Server IP
    ip: window.process.env.IP || '0.0.0.0',

    // Should we populate the DB with sample data?
    seedDB: false,
    localDev: window.process.env.LOCAL || false,
    secondInstance: window.process.env.SECOND_INSTANCE || false,

    // List of user roles
    userRoles: ['guest', 'user', 'admin'],
    dataRootPath: window.process.env.SECOND_INSTANCE ? '/Glossa2' : 'Glossa',
};
// Export the config object based on the NODE_ENV
// ==============================================

module.exports = _.merge(
    all,
    require('./' + window.process.env.NODE_ENV + '.js') || {});
