const Discovery = require('udp-discovery').Discovery;
const socketClient = require('../socket/socket-client');

let discover;
let serviceName;
let available;
let userData;

module.exports = {
  init: (server, io, win) => {
    console.log('udp init');
    serviceName = 'Glossa-' + global.appData.initialState.user._id;
    let interval = 5000; //lets just broadcast the ip every 5 seconds


    console.log('discover: ', discover);

    if (discover && discover.services && discover.services[serviceName]) {
      console.log('resuming service');
      discover.update(serviceName, userData, interval, true);
    } else {
      console.log(' making new service');
      discover = new Discovery();
      //basic data that will be broadcast across network to all users
      userData = {
        app: 'Glossa',
        name: global.appData.initialState.user.name,
        _id: global.appData.initialState.user._id,
        avatar: global.appData.initialState.user.avatar,
        available: true
      };

      //announce our service
      discover.announce(serviceName, userData, interval, true);
      discover.on('available', function (name, data, reason) {
        console.log('service available')
        //if it's a glossa application and the name is not the same as our name...
        if (data.data.app === 'Glossa' && name !== serviceName) {
          //Init socket-client
          socketClient.init(data, io, win)
        }
      });
    }
  },

  stop: () => {
    let interval = 5000;
    if (userData && discover) {
      userData.available = false;
      discover.update(serviceName, userData, interval, false);
    }
  }
};

