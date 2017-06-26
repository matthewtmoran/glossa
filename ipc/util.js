var electron = require('electron');
var ipcMain = electron.ipcMain;
var BrowserWindow = electron.BrowserWindow;
var mainBrowserWindow;


module.exports = {

  initBrowserWindow: (callback) => {
    mainBrowserWindow = BrowserWindow.getFocusedWindow();

    if (mainBrowserWindow) {
      callback();
    }

  },

  on: (eventName, callback) => {
    ipcMain.on(eventName, (...args) => {
      callback.apply(ipcMain, args);
    })
  },

  send:(eventName, data, callback) => {
    mainBrowserWindow.send(eventName, data, (...args) => {
      if (callback) {
        callback.apply(ipcMain, args);
      }
    })
  }


};