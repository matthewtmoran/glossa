//
//
//
// // const path = require('path');
// const fs = require('fs');
// const electron = require('electron');
// const app = electron.app;  // Module to control application life.
// const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
// var mainWindow = null;
// var config = require('./server/config/environment');
//
//
//
// // Quit when all windows are closed.
// app.on('window-all-closed', function () {
//     if (process.platform != 'darwin') {
//         app.quit();
//     }
// });
//
// app.on('ready', function () {
//
//     app.server = require(path.join(__dirname, '/server/app'));
//
//     // Create the browser window.
//     mainWindow = new BrowserWindow({
//         width: 800,
//         height: 600,
//     });
//
//     // and load the index.html of the app.
//     mainWindow.loadURL('http://localhost:' + config.port);
//     // mainWindow.loadURL('file://' + __dirname + '/client/index.html');
//
//     // Open the devtools.
//     mainWindow.openDevTools();
//
//
//     // Emitted when the window is closed.
//     mainWindow.on('closed', function () {
//
//         // Dereference the window object, usually you would store windows
//         // in an array if your app supports multi windows, this is the time
//         // when you should delete the corresponding element.
//         mainWindow = null;
//     });
//
// });
var electron = require('electron'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow;

var path = require('path');
var url = require('url');
// const express = require('./server/app'); //your express app

var config = require('./server/config/environment');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var myBonjourService;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 800, height: 600});

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: 'http://localhost:' + config.port
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
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
    app.quit()
}
});

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});