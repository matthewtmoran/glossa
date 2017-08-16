var electron = require('electron');
var ipc = electron .ipcMain;
var BrowserWindow = electron.BrowserWindow;
var mainBrowserWindow;

module.exports = function() {

  ipc.on('test:event', (event, data) => {
    console.log('ipc event: test:event');
  });

  ipc.on('window:loaded', (event, data) => {
    console.log('ipc event: window:loaded');
    console.log('event', event);
    console.log('data', data);
  });
};



module.exports = {

  on: (eventName, callback) => {
    ipc.on(eventName,(...args) => {
      callback.apply(ipc, args);
    })
  },

};