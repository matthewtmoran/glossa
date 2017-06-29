var electron = require('electron');
var ipcMain = electron.ipcMain;
var BrowserWindow = electron.BrowserWindow;
var remote = electron.remote;


var mainBrowserWindow;


module.exports = {

  on: (eventName, callback) => {
    ipcMain.on(eventName, (...args) => {
      callback.apply(ipcMain, args);
    })
  },

  send:(eventName, data) => {
    console.log('send is being called.....');

    BrowserWindow.getFocusedWindow().webContents.send(eventName, data);

    // BrowserWindow.getFocusedWindow().send(eventName, data);


    // mainBrowserWindow.send(eventName, data, (...args) => {
    //   if (callback) {
    //     callback.apply(ipcMain, args);
    //   }
    // })
  }


};