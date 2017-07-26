const Discovery = require('udp-discovery').Discovery;
const ipcUtil = require('../ipc/util');
const socketServer = require('../socket');
const socketClient = require('../socket/socket-client');
module.exports = {
  init: function (server, io, win) {
    let discover = new Discovery();
    let serviceName = 'Glossa-' + global.appData.initialState.user._id;
    let interval = 500;
    let available = global.appData.initialState.settings.isSharing;

    //basic data that will be broadcast across network to all users
    let userData = {
      app: 'Glossa',
      name: global.appData.initialState.user.name,
      _id: global.appData.initialState.user._id,
      avatar: global.appData.initialState.user.avatar
    };

    //announce our service
    discover.announce(serviceName, userData, interval, available);

    //when other services come alive
    discover.on('available', function (name, data, reason) {
      console.log('available ', name);
      console.log('reason', reason);

      //if it's a glossa application and it's not our own service (though h I'm not sure that this is an issue with this package)
      if (data.app === 'Glossa' && name !== serviceName) {
        console.log('External Glossa Application Online');
        console.log('TODO: update connection list');
        console.log('TODO: broadcast update-connection-list');
        // socketClient.init(data, io)

      }
    });

    discover.on('unavailable', function (name, data, reason) {
      console.log(name, ':', 'unavailable:', reason);
      console.log(data);
    });
  }
};