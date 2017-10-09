var electron = require('electron'),
  app = electron.app,
  BrowserWindow = electron.BrowserWindow,
  ipcMain = electron.ipcMain,
  shell = electron.shell;




module.exports = {

  navigateToState: function(state) {
    if (BrowserWindow.getFocusedWindow()) {
      BrowserWindow.getFocusedWindow().webContents.send('navigateToState', {state:state})
    }
  },

  navigateToExternalUrl: function(page) {
    shell.openExternal(page);
  },

  quitApp: function() {
    app.quit();
  },

  importProject: function() {
    BrowserWindow.getFocusedWindow().webContents.send('import:project');
  },

  exportProject: function() {
    BrowserWindow.getFocusedWindow().webContents.send('export:project');
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