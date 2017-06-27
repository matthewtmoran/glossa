var fs = require('fs');
var electron = require('electron'),
  path = require('path'),
  app = electron.app,
  BrowserWindow = electron.BrowserWindow,
  express,
  bonjour = require('bonjour')();
var url = require('url');
var AppMenu = require('./app-menu');
var socketUtil = require('./server/socket/socket-util');
var ipc = require('./ipc')();
var Notebook = require('./server/api/notebook/notebook.model');


const isDarwin = process.platform === 'darwin';
const isWin10 = process.platform === 'win32';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var icon = path.join(__dirname, 'src/img/app-icons/win/glossa-logo.ico');
app.setPath('userData', path.join(app.getPath('appData'), 'Glossa'));
function startExpress() {
  fsCheck();
  Promise.all([require('./server/config/init').getInitialState()])
    .then(function (appData) {
      // here we set the global state for the entire app.
      //we also pass this data to the express server
      global.appData = {
        initialState: appData[0],
        isWindows: process.platform === 'win32'
      };
      express = require('./server/app')(bonjour, appData[0]);
  });
}
startExpress();


function fsCheck() {

  var dataPaths = [
    'Glossa',
   'Glossa/storage',
   'Glossa/image',
   'Glossa/audio',
   'Glossa/temp',
  ];

  dataPaths.forEach((p) => {
    let storagePath = path.join(app.getPath('appData'), p);

    if (!fs.statSyncNoException(storagePath)) {
      console.log('path does not exist....');
      fs.mkdirSync(storagePath);
      console.log('path created...')
    }
  });

  console.log('done fs check');

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
    pathname: 'http://localhost:9000'
  }));

  // Open the DevTools.
  win.webContents.openDevTools();

  win.once('ready-to-show', () => {
    // ipcListeners.initIpcListeners();
    win.show()
  });

  // Emitted when the window is closed.
  win.on('closed', function (e) {
    console.log('');
    console.log('close event');


    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

    //if the process is not windows (aka mac or linux)
    // if (process.platform != 'win32') {
    //     //if force quite is false (not cmd+Q) aka the 'x'
    //     if(!forceQuit){
    //         //prevent the default action.  What is the default action?
    //         e.preventDefault();
    //         //hide window.  does this dock it?  does the socket remain in tact when docked?
    //         win.hide();
    //     }
    //
    // } else {
    //     //if the process is windows.... destroy the window object.
    //     win = null;
    // }

    win = null;

  })
}

//triggered first when cmd+Q or close button in menu
app.on('before-quit', function (e) {
  console.log('');
  console.log('before-quit');

  bonjour.unpublishAll(function (val) {
    console.log('bonjour.unpublishAll');
  });

  bonjour.destroy();
  beforeQuitThenQuit();
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
  createWindow();
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
    app.quit();
  }
});

app.on('activate', function () {
  console.log('activate called');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
});


function beforeQuitThenQuit() {
  socketUtil.resetClientData().then(function () {
    console.log('resetClientData promise resolved');
  });
}

