const fs = require('fs');
const electron = require('electron');
const path = require('path');
const app = electron.app;
const url = require('url');
const AppMenu = require(path.join(__dirname, './app-menu'));
const isDarwin = process.platform === 'darwin';
const isWin10 = process.platform === 'win32';
const express = require(path.join(__dirname, './server/app'));
const config = require(path.join(__dirname, './server/config/environment'));
let BrowserWindow = electron.BrowserWindow;

//for mac to decide what to do with window object.. to quit or hide...
let forceQuit = false;
//flag to ensure server is running before electron creates window - this fixes mac wsod issue when err_connection refused is thrown
let readyToGo = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var icon = path.join(__dirname, 'src/img/app-icons/win/glossa-logo.ico');
app.setPath('userData', path.join(app.getPath('appData'), config.dataRootPath));
function startExpress() {
  fsCheck();
  Promise.all([require(path.join(__dirname, './server/config/init')).getInitialState()])
    .then(function (appData) {
      readyToGo = true; // set flag to true so electron can create window
      // here we set the global state for the entire app.
      //we also pass this data to the express server
      global.appData = {
        initialState: appData[0],
        isWindows: process.platform === 'win32'
      };

      express(appData[0]);
    });
}
startExpress();


function fsCheck() {

  const dataPaths = [
    config.dataRootPath,
    config.dataRootPath + '/storage',
    config.dataRootPath + '/image',
    config.dataRootPath + '/audio',
    config.dataRootPath + '/temp',
  ];

  dataPaths.forEach((p) => {
    let storagePath = path.join(app.getPath('userData'), p);

    if (!fs.statSyncNoException(storagePath)) {
      fs.mkdirSync(storagePath);
    }
  });
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    show: false,
    center: true,
    frame: !isWin10,
    customButtonsOnHover: true,
    width: 1200,
    height: 750,
    minWidth: 400,
    minHeight: 300,
    backgroundColor: '#fff',
    webPreferences: {
      webSecurity: false,
      zoomFactor: 1
    },
    acceptFirstMouse: true, //setting may need to be changed for macs...
    title: 'Glossa',
    icon: icon //this works for windows.. for mac this will need to be defined a different way
    // icon: path.join(__dirname, 'dist/img/app-icons/mac/glossa-logo.icns') //for dev for mac
  });

  //build the menu...
  AppMenu.buildMenu(win);

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: 'http://localhost:' + config.port.toString()
  }));

  // Open the DevTools.
  win.webContents.openDevTools();

  win.once('ready-to-show', () => {
    // ipcListeners.initIpcListeners();
    win.show()
  });

  // Emitted when the window is closed.
  win.on('close', (e) => {
    console.log('');
    console.log('close event');
    if (isWin10) {
      forceQuit = true;
    }
    if (isWin10 || forceQuit) {
      win = null;
    } else {
      e.preventDefault();
      win.hide();
    }
  });
}

//triggered first when cmd+Q or close button in menu
app.on('before-quit', (e) => {
  console.log('');
  console.log('before-quit');
  setTimeout(() => {
    console.log('set timeout test for mac....');
  },3000);
  forceQuit = true;
});

app.on('activate-with-no-open-windows', function () {
  console.log('');
  console.log('activate-with-no-open-windows');
  win.show();
});


app.on('will-quit', function () {
  // This is a good place to add tests insuring the app is still
  // responsive and all windows are closed.
  console.log('');
  console.log("will-quit");
  // win = null;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  //if data from init has returned create window otherwise check 10 times a second as it should be coming shortly...
  if (readyToGo) {
    createWindow();
  } else {
    let checkReadyState = setInterval(() => {
      if (readyToGo) {
        //yay, it's ready to load clear interval and create window
        clearInterval(checkReadyState);
        createWindow()
      }
    }, 100)
  }

});

//this event is triggered first on windows when electron closes from clicking the X
// Quit when all windows are closed.
app.on('window-all-closed', function () {
  console.log('');
  console.log('window-all-closed');
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    //this only happens when it's not a mac
    console.log('quitting app now from non-mac');
    //set this timeout to ensure that bonjour is fully unpublished and destroyed
    //TODO: consider if this is needed...
    setTimeout(() => {
      app.quit();
    }, 3000)

  }


});

//for mac activate new window if it was closed at all... i.e. clicking doc
app.on('activate', function () {
  console.log('activate called');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  //if window is destroyed... create a new one other wise just show the window
  if (!win) {
    createWindow()
  } else {
    win.show();
  }
});

//so we can get the window (if it exists... ) to close and send ipc events properly
// function getWindow(callback) {
//   callback(null, win);
// }

function getWindow () {
  return win;
}

//TODO: consider deletion
function _unref () {
  delete win[this.id]
}

function setReadyToGo() {
  readyToGo = true;
}

function getForceQuit() {
  return forceQuit;
}

module.exports = {
  _unref: _unref,
  getWindow: getWindow,
  setReadyToGo: setReadyToGo,
  getForceQuit: getForceQuit
};


