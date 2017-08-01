const Discovery = require('udp-discovery').Discovery;
const ipcUtil = require('../ipc/util');
const socketServer = require('../socket');
const socketClient = require('../socket/socket-client');

module.exports = {
  init: (server, io, win) => {
    console.log('udp begin');
    this.discover = new Discovery();
    this.serviceName = 'Glossa-' + global.appData.initialState.user._id;
    let interval = 500;
    let available = global.appData.initialState.settings.isSharing;

    //basic data that will be broadcast across network to all users
    this.userData = {
      app: 'Glossa',
      name: global.appData.initialState.user.name,
      _id: global.appData.initialState.user._id,
      avatar: global.appData.initialState.user.avatar
    };

    console.log('announcing discovery');

    //announce our service
    this.discover.announce(this.serviceName, this.userData, interval, available);

    //when other services come alive
    this.discover.on('available', function (name, data, reason) {
      console.log('available ', name);
      console.log('reason', reason);

      //if it's a glossa application and it's not our own service (though h I'm not sure that this is an issue with this package)
      if (data.app === 'Glossa' && name !== serviceName) {
        console.log('External Glossa Application Online');
        socketClient.init(data, io, win)
      }
    });

    this.discover.on('unavailable', function (name, data, reason) {
      console.log(name, ':', 'unavailable:', reason);
      console.log(data);
    });

  },

  stop: () => {
    this.discover.update(this.serviceName, this.userData, 500, false)
  }
};

