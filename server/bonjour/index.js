const config = require('../config/environment');
var socketUtil = require('../socket/socket-util');
var localService;
var runTest1 = 0;
var runTest2 = 0;
var runTest3 = 0;
module.exports.init = function (server, bonjour, io, win) {
  let browser = bonjour.find({type: 'http'}); //bonjour find services
  console.log('!!bonjour in bonjour', !!bonjour);
  console.log('init sharing called...');

  let glossaUser = global.appData.initialState.user; // local user data
  let session = global.appData.initialState.session; //local session data

  // let io = require('socket.io')(server); // socket.io

  // let externalSocketClient = require('../socket/socket-client'); //client portion of socket

  //main socket server
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
        console.log('...External service found CONNECT node socket client');

        //this is where we connect to a serve as a client.
        //On other devices, we will show up as a client
        //they will see our data through this
        //this is how we send out data
        require('../socket/socket-client').initAsClient(service, glossaUser, io)



        // //this gets called everytime a service connects
        // function initSocketClient() {
        //
        //   console.log('');
        //   console.log('--- initAsClient called'); //only runs once per service
        //
        //
        //   this.externalPath = 'http://' + service.referer.address + ':' + service.port.toString();
        //   this.nodeClientSocket = require('socket.io-client')(this.externalPath);
        //   console.log('--- !!nodeClientSocket', !!this.nodeClientSocket); // only runs once
        //
        //
        //   runTest1++;
        //   console.log('runTest1', runTest1);
        //
        //   setInterval(() => {
        //     console.log('');
        //     console.log('-------------');
        //     console.log('runTest1 service up (this will be the exact same as restarts...)', runTest1);
        //     console.log('runTest2 on connect event (this is getting duplicated?)', runTest2);
        //     console.log('-------------');
        //     console.log('');
        //   },3000);
        //
        //

        //
        //   //initial connection to another server
        //   //.once solve the problem however I'm not sure this will work with more than one connection
        //   //the other issue will be removing event listeners
        //   //TODO: !IMPORTANT - test for multiple connections
        //
        //   //https://github.com/socketio/socket.io-client/issues/103
        //   this.nodeClientSocket.once('connect', () => {
        //     console.log('');
        //     console.log('--- on:: connect');
        //     runTest2++;
        //     console.log('runTest2', runTest2);
        //     console.log("--- nodeClientSocket.id on connect event", this.nodeClientSocket.id);
        //     console.log('');
        //   });
        //
        //   this.nodeClientSocket.on('disconnect', (reason) => {
        //     console.log('');
        //     console.log('--- on:: disconnect');
        //     console.log('reason', reason);
        //     console.log('--- nodeClientSocket.id on disconnect event', this.nodeClientSocket.id);
        //     console.log('');
        //   });
        //
        //
        //   // setInterval(() => {
        //   //   console.log(' --- nodeClientSocket.id interval', this.nodeClientSocket.id)
        //   // }, 3000);
        //
        //
        //   //recievs event from an external server and emits the end-handshake
        //   this.nodeClientSocket.on('begin-handshake', () => {
        //     console.log('--- on:: begin-handshake');
        //     console.log('--- nodeClientSocket.id on begin-handshake event', this.nodeClientSocket.id);
        //     const basicProfileData = {
        //       _id: global.appData.initialState.user._id,
        //       name: global.appData.initialState.user.name,
        //       type: 'external-client',
        //       socketId: this.nodeClientSocket.id,
        //       avatar: global.appData.initialState.user.avatar
        //     };
        //
        //     console.log('--- emit:: end-handshake');
        //     this.nodeClientSocket.emit('end-handshake', basicProfileData)
        //   });
        //
        //   //a server is requesting data from a connected client
        //   //@data = {notebooks: Array}
        //   this.nodeClientSocket.on('sync-data', (data) => {
        //     console.log('--- on:: sync-data');
        //
        //     console.log('--- nodeClientSocket.id on sync-data event', nodeClientSocket.id);
        //
        //     socketUtil.getNewAndUpdatedNotebooks(data.notebooks)
        //       .then(notebooksToSend => {
        //
        //         // console.log('does notebook have audioBuffer attached?', !!notebooksToSend[0].audioBuffer);
        //         // console.log('does notebook have imageBuffer attached?', !!notebooksToSend[0].imageBuffer);
        //
        //         console.log('--- emit:: sync-data:return to:: whoever requested it');
        //         nodeClientSocket.emit('sync-data:return', {notebooks: notebooksToSend})
        //
        //       })
        //
        //
        //   });
        //
        //
        // }
        // initSocketClient();







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
