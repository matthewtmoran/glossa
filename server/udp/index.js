  const Discovery = require('udp-discovery').Discovery;
  const ipcUtil = require('../ipc/util');
  const socketClient = require('../socket/socket-client');

  let discover;
  let serviceName;
  let available;
  let userData;

  module.exports = {
    init: (server, io, win) => {
      console.log('***udp.init***');
      discover = new Discovery();

      let listOfApps = {};

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

      console.log('***announcing discovery***');
      console.log('***My Service name***: ', serviceName );
      //announce our service
      discover.announce(serviceName, userData, interval, available);

      //when other services come alive
      discover.on('available', function (name, data, reason) {
        console.log('App Available :', name);
        console.log('app Data: ', data);
        console.log('reason', reason);

        console.log('Checking data.app:', (data.data.app === 'Glossa'));
        console.log('Checking name: ', name !== serviceName);

        //if it's a glossa application and it's not our own service (though h I'm not sure that this is an issue with this package)
        if (data.data.app === 'Glossa' && name !== serviceName) {
          console.log('External Glossa Application Online');

          if (!listOfApps[name]) {
            listOfApps[name] = {};
            listOfApps[name].disconnect = false;
            console.log('And we have not connected to this instance yet');
            socketClient.init(data, io, win)
          } else {
            console.log('But we are already connected to this instance so make sure disconnect is false ');
            console.log('we must be reconnecting...');
            listOfApps[name].disconnect = false
          }
        } else {
          console.log('Not connected to this service.');
          if (name === serviceName) {
            console.log('because this is our instance');
          }
        }
      });

      discover.on('unavailable', function (name, data, reason) {
        if (listOfApps[name]) {
          console.log('This app is in the list of connected apps');
          listOfApps[name].disconnect = true;
          console.log('disconnect set to true');

          setTimeout(function() {
            console.log('Wait 7 seconds before we disconnect it');
            if (listOfApps[name].disconnect) {
              console.log('app is truly disconnected');
              delete listOfApps[name];
            } else {
              console.log('app must have reconnected');
            }
          }, 7000)
        }
        console.log(name, ':', 'unavailable:', reason);
        console.log(data);
      });

    },

    stop: () => {
      discover.update(serviceName, userData, 500, false)
    }
  };

