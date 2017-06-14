var electron = require('electron'),
  app = electron.app,
  BrowserWindow = electron.BrowserWindow,
  ipcMain = electron.ipcMain;




module.exports = {

  navigateToState: function(state) {
    console.log('navigateToState')
    if (BrowserWindow.getFocusedWindow()) {
      BrowserWindow.getFocusedWindow().webContents.send('navigateToState', {state:state})
    }
  },

  quitApp: function() {
    app.quit();
  },

  importProject: function() {
    BrowserWindow.getFocusedWindow().webContents.send('import:project');
  },

  toggleFullScreen: function () {
    let win = BrowserWindow.getFocusedWindow();

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  },

  reload: function() {
    BrowserWindow.getFocusedWindow().webContents.send('reloadCurrentState')
  },

  reloadAll: function() {
    BrowserWindow.getFocusedWindow().reload();

  }


};