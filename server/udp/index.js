const Discovery = require('udp-discovery').Discovery;
const socketClient = require('../socket/socket-client');

let discover;
let serviceName;
let available;
let userData;

module.exports = {
  init: (server, io, win) => {
    discover = new Discovery();
    serviceName = 'Glossa-' + global.appData.initialState.user._id;
    let interval = 5000; //lets just broadcast the ip every 5 seconds
    available = global.appData.initialState.settings.isSharing;

    //basic data that will be broadcast across network to all users
    userData = {
      app: 'Glossa',
      name: global.appData.initialState.user.name,
      _id: global.appData.initialState.user._id,
      avatar: global.appData.initialState.user.avatar
    };

    //announce our service
    discover.announce(serviceName, userData, interval, available);

    //when other udp broadcasts announce themselves
    //ultimately, this is triggered a lot.  However, we are handlign everything through socket where we amintain a list of active connections
    discover.on('available', function (name, data, reason) {
      //if it's a glossa application and the name is not the same as our name...
      if (data.data.app === 'Glossa' && name !== serviceName) {
        //Init socket-client
        socketClient.init(data, io, win)
      }
    });
  },

  stop: () => {
    discover.update(serviceName, userData, 500, false)
  }
};

