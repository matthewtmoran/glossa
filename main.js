const fs = require('fs');
const path = require('path');
const electron = require('electron');
const app = electron.app;

//had to put this into a function becuase of babel error
function preRun () {
  if(require('electron-squirrel-startup')) {
    return;
  }
  // this should be placed at top of main.js to handle setup events quickly
  if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
  }
};
preRun();

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

const url = require('url');
const AppMenu = require('./main/app-menu');
const isDarwin = process.platform === 'darwin';
const isWin10 = process.platform === 'win32';
let BrowserWindow = electron.BrowserWindow;
let serverWindow;

//for mac to decide what to do with window object.. to quit or hide...
let forceQuit = false;
//flag to ensure server is running before electron creates window - this fixes mac wsod issue when err_connection refused is thrown
let readyToGo = true;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var icon = path.join(__dirname, 'src/img/app-icons/win/glossa-logo.ico');


function createWindow() {
  serverWindow = new BrowserWindow({show: false,});
  serverWindow.webContents.openDevTools();
  serverWindow.loadURL(path.join('file://', __dirname, '/dist/server.html'));

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

  //TODO: make external config file for electron...
  // and load the index.html of the app.


  serverWindow.on('ready-to-show', ()=> {
    serverWindow.show();
    win.loadURL(url.format({
      pathname: 'http://localhost:9000'
    }));
  });

  // Open the DevTools.

  // win.once('ready-to-show', () => {
  //   // ipcListeners.initIpcListeners();
  //   win.show()
  // });

  win.on('ready-to-show', ()=> {
    win.webContents.openDevTools();
    win.show();
  });

  win.on('crashed', (event)=> {
    console.log('Client window crashed', event);
  });



  // Emitted when the window is closed.
  win.on('close', (e) => {
    console.log('');
    console.log('close event');
    if (isWin10) {
      forceQuit = true;
    }
    if (isWin10 || forceQuit) {
      console.log('closing windows');
      win = null;
      serverWindow.close();
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

function getServerWin () {
  return serverWindow;
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
  getServerWin: getServerWin,
  _unref: _unref,
  getWindow: getWindow,
  setReadyToGo: setReadyToGo,
  getForceQuit: getForceQuit
};


