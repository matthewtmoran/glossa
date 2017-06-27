const bonjour = require('bonjour')();
const config = require('../config/environment');
var localService;


exports.init = function (server) {
  let glossaUser = global.appData.initialState.user;
  let session = global.appData.initialState.session;
  let browser = bonjour.find({type: 'http'});
  let io = require('socket.io')(server);
  let externalSocketClient = require('../socket/socket-client');

  require('../socket')(glossaUser, session, io, browser, bonjour);

  console.log('Bonjour is listening...');

  localService = bonjour.publish({
    name: 'glossaApp-' + glossaUser._id,
    type: 'http',
    port: config.port,
    txt: {
      userid: glossaUser._id
    }
  });


  browser.on('error', function (service) {
    console.log('browser - Here is an error', service);
  });

  browser.on('down', function (service) {
    console.log('');
    console.log('Service went down.......', service.name);
    console.log('Service on network:', browser.services.length);
    console.log('');

    if (service.name === localService.name) {
      // bonjour.destroy(function () {
      //   console.log('is there a callback on destroy?');
      // })
    }


  });

  browser.on('up', function (service) {
    console.log('');
    console.log('Service went/is live........', service.name);
    if (service.name !== 'glossaApp-' + glossaUser._id) {

      console.log('((not our service))');
    }
    if (service.name === 'glossaApp-' + glossaUser._id) {
      console.log('((is our service))');
    }

    console.log('Services on network:', browser.services.length);
    console.log('');

    // make sure network service is a glossa instance....
    if (service.name.indexOf('glossaApp') > -1) {
      console.log('A glossa Application is online');
      if (service.name === 'glossaApp-' + glossaUser._id) {
        console.log('...Local service found IGNORE');

      } else if (service.name !== 'glossaApp-' + glossaUser._id) {
        console.log('...External service found CONNECT');

        //this is where we connect to a serve as a client.
        //On other devices, we will show up as a client
        //they will see our data through this
        //this is how we send out data
        externalSocketClient.initAsClient(service, glossaUser, io)

      }
    }
    console.log('');
  });

};

exports.disconnect = function () {

  console.log('disconnect event (stopping sharing)');

  //stopping seems to work for publishing services
  //TODO: need to test to see if sockets remain open
  //TODO: on toggle event listeners are duplicated - not sure this has much impact if any considering user intentionality though it does exist.
  localService.stop(function (val) {
    console.log('stopped local service... ');
  })

};
