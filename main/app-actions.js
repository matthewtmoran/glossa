const {app, BrowserWindow, ipcMain, shell, webContents} = require('electron');

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

  exportProject: function(event) {
    webContents.fromId(2).send('export:project');
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

function getWindow(windowName) {
  for (var i = 0; i < windowArray.length; i++) {
    if (windowArray[i].name == windowName) {
      return windowArray[i].window;
    }
  }
  return null;
}