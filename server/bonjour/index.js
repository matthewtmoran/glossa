const config = require('../config/environment');
var localService;

module.exports.init = function (server, bonjour, io, win) {
  let browser = bonjour.find({type: 'http'}); //bonjour find services
  console.log('!!bonjour in bonjour', !!bonjour);
  console.log('init sharing called...');

  let glossaUser = global.appData.initialState.user; // local user data
  let session = global.appData.initialState.session; //local session data

  // let io = require('socket.io')(server); // socket.io

  let externalSocketClient = require('../socket/socket-client'); //client portion of socket

  console.log('start socket.io server');
  require('../socket')(glossaUser, session, io, bonjour, win); //main socket server



  localService = bonjour.publish({
    name: 'glossaApp-' + glossaUser._id,
    type: 'http',
    port: config.port,
    txt: {
      userid: glossaUser._id
    }
  }); //local service info - published

  console.log('Bonjour is listening...');

  //if errors occur with service
  browser.on('error', function (service) {
    console.log('browser - Here is an error', service);
  });

  //when a service goes down
  browser.on('down', function (service) {
    console.log('');
    console.log('Service went down.......', service.name);
    console.log('Service on network:', browser.services.length);
    console.log('');
  });

  // setInterval(() => {
  //   console.log('browser.services.length', browser.services.length);
  // }, 3000)


  //when a service comes alive
  //check what kind of service it is
  //if it's a glossa service and is not our own glossa service, connect to it as a client
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

module.exports.disconnect = function (bonjour) {

  console.log('disconnect event (stopping sharing)');

  bonjour.unpublishAll(() => {
    console.log('all bonjour services unpublished in bonjour/index.js....');
    bonjour.destroy();
  });

  //stopping seems to work for publishing services
  //TODO: need to test to see if sockets remain open
  //TODO: on toggle event listeners are duplicated - not sure this has much impact if any considering user intentionality though it does exist.

};
