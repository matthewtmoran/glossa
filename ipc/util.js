var electron = require('electron');
var ipcMain = electron.ipcMain;
var BrowserWindow = electron.BrowserWindow;
var mainBrowserWindow;


module.exports = {

  initBrowserWindow: () => {
    console.log('initBrowserWindow called');
    mainBrowserWindow = BrowserWindow.getFocusedWindow();
    console.log('does mainBrowserWindow exist?', !!mainBrowserWindow)
  },

  on: (eventName, callback) => {
    ipcMain.on(eventName, (...args) => {
      callback.apply(ipcMain, args);
    })
  },

  send:(eventName, data) => {
    console.log('does mainBrowserWindow exist?', !!mainBrowserWindow);
    mainBrowserWindow.send(eventName, data);


    // mainBrowserWindow.send(eventName, data, (...args) => {
    //   if (callback) {
    //     callback.apply(ipcMain, args);
    //   }
    // })
  }


};