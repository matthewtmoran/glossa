var electron = require('electron'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow;

var socketUtil = require('./server/socket/socket-util');
var url = require('url');
// var config = require('./server/config/environment');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;

function createWindow () {

    // Create the browser window.
    win = new BrowserWindow({
        width: 1200,
        height: 750,
        webPreferences: {
            nodeIntegration: false,
            webSecurity: false
        }
    });


    // var dataPath = app.getPath('userData');

    var express = require('./server/app')();

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: 'http://localhost:9000'
    }));

    // win.loadURL(url.format({
    //     pathname: path.join(__dirname, 'client/index.html'),
    //     protocol: 'file:',
    //     slashes: true
    // }));

    // win.loadURL(__dirname, 'client/index.html');
    // win.loadURL('http://localhost:' + config.port);

    // Open the DevTools.
    win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    console.log('');
    console.log('window-all-closed');
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        socketUtil.resetClientData().then(function() {
            console.log('resetClientData being called')
            app.quit()
        });
    }
});

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});


