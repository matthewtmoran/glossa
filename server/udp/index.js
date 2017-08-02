const Discovery = require('udp-discovery').Discovery;
const ipcUtil = require('../ipc/util');
const socketServer = require('../socket');
const socketClient = require('../socket/socket-client');

let discover;
let serviceName;
let available;
let userData;

module.exports = {
  init: (server, io, win) => {
    console.log('udp begin');
    discover = new Discovery();

    serviceName = 'Glossa-' + global.appData.initialState.user._id;
    let interval = 500;
    available = global.appData.initialState.settings.isSharing;

    //basic data that will be broadcast across network to all users
    userData = {
      app: 'Glossa',
      name: global.appData.initialState.user.name,
      _id: global.appData.initialState.user._id,
      avatar: global.appData.initialState.user.avatar
    };

    console.log('announcing discovery');
    console.log('My Service name: ', serviceName );
    //announce our service
    discover.announce(serviceName, userData, interval, available);

    //when other services come alive
    discover.on('available', function (name, data, reason) {
      console.log('App Available :', name);
      console.log('reason', reason);

      console.log('Checking data.app:', (data.app === 'Glossa'));
      console.log('Checking name: ', name !== serviceName);

      //if it's a glossa application and it's not our own service (though h I'm not sure that this is an issue with this package)
      if (data.app === 'Glossa' && name !== serviceName) {
        console.log('External Glossa Application Online');
        socketClient.init(data, io, win)
      } else {
        console.log('Not connected to this service.');
      }
    });

    discover.on('unavailable', function (name, data, reason) {
      console.log(name, ':', 'unavailable:', reason);
      console.log(data);
    });

  },

  stop: () => {
    discover.update(serviceName, userData, 500, false)
  }
};

