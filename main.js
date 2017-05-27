var electron = require('electron'),
    path = require('path'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow,
    Menu = electron.Menu,
    ipcMain = electron.ipcMain;


var socketUtil = require('./server/socket/socket-util');
var url = require('url');
// var config = require('./server/config/environment');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
var forceQuit = false;
var menuTemplate = [{
    label: "Application",
    submenu: [
        { label: "About", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Preferences", click: function(item, focusedWindow){focusedWindow.webContents.send('changeState', 'settings.project');}},
        { type: "separator" },
        { label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click: function (item, focusedWindow) {
                if (focusedWindow) focusedWindow.webContents.toggleDevTools()
            } },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: function() {win.reload();} },
        { type: "separator" },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: function() {forceQuit=true; app.quit();}}
    ]}, {
    label: "File",
    submenu: [
        { label: 'Load Project', click: importProject},
    ]}, {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
];




var menu = Menu.buildFromTemplate(menuTemplate);
var icon =  path.join(__dirname, 'src/img/app-icons/win/glossa-logo.ico');
console.log('icon', icon);

function importProject() {
    win.webContents.send('import:project');
}

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        titleBarStyle: 'hidden',
        width: 1200,
        height: 750,
        webPreferences: {
            webSecurity: false,
            zoomFactor: 1
        },
      icon: icon
      // icon: path.join(__dirname, 'dist/img/app-icons/mac/glossa-logo.icns') //for dev for mac
    });


    var express = require('./server/app')();

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: 'http://localhost:9000'
    }));

    // Open the DevTools.
    win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', function(e) {
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
    //if force quite is false (not cmd+Q) aka the 'x'
    if(!forceQuit){
        console.log('no force quit');
        //prevent the default action.  What is the default action?
        e.preventDefault();
        //hide window.  does this dock it?  does the socket remain in tact when docked?
        // win.hide();
    } else {
        console.log('yes force quit');
        beforeQuitThenQuit();
    }
});

app.on('activate-with-no-open-windows', function(){
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
app.on('ready', function() {
    Menu.setApplicationMenu(menu);
    createWindow();
});

//this event is triggered first on windows when electron closes from clicking the X
// Quit when all windows are closed.
app.on('window-all-closed', function() {
    console.log('');
    console.log('window-all-closed');
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        //this only happens when it's not a mac
        console.log('quitting app now.');
        forceQuit = true;
        app.quit();
    }
});

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});


function beforeQuitThenQuit() {
    socketUtil.resetClientData().then(function() {
        console.log('resetClientData promise resolved');
    });
}

