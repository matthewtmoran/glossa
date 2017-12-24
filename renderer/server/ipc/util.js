const {BrowserWindow, ipcMain, ipcRenderer} = require('electron');



module.exports = {

  on: (eventName, callback) => {
    ipcRenderer.on(eventName, (...args) => {
      console.log('on in ipc util client server');
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