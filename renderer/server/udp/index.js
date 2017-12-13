import UserController from '../api/user/user.controller';
const Discovery = require('udp-discovery').Discovery;
const socketClient = require('../socket/socket-client');
const User = require('../api/user/user.model');


let discover;
let serviceName;
let available;
let userData;

module.exports = {
  init: (server, io) => {
    console.log('begin udp saga');
    let interval = 5000; //lets just broadcast the ip every 5 seconds

    UserController.find()
      .then((user) => {
        console.log('user found and returned');

        serviceName = 'Glossa-' + user._id;

        if (discover && discover.services && discover.services[serviceName]) {
          console.log('updating service on network');
          discover.update(serviceName, userData, interval, true);
        } else {
          console.log('creating new service on network');
          discover = new Discovery();

          userData = {
            app: 'Glossa',
            name: user.name,
            _id: user._id,
            avatar: user.avatar,
            available: true
          };

          console.log('Announcing service to network');
          discover.announce(serviceName, userData, interval, true);

          discover.on('available', function (name, data, reason) {
            console.log('A service became available on network!');
            //if it's a glossa application and the name is not the same as our name...
            if (data.data.app === 'Glossa' && name !== serviceName) {
              console.log('A Glossa became available on network!');
              //Init socket-client
              socketClient.init(data, io)
            } else {
              console.log('Unidentified service - do nothing');
            }
          });

        }


      })
      .catch((reason) => {
        console.log('Something wrong with finding user', reason);
      })
  },

  stop: () => {
    let interval = 5000;
    if (userData && discover) {
      userData.available = false;
      discover.update(serviceName, userData, interval, false);
    }
  }
};

