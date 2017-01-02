const electron = require('electron');
const app = electron.app;  // Module to control application life.
const path = require('path');
const fs = require('fs');
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const userDataPath = (app).getPath('userData');
const userDataRoot = path.join(userDataPath, '/data');
const client = require('electron-connect').client;
var mainWindow = null;


/* create object of paths

 var remote = require('electron').remote;
 console.log('remote', remote);
 console.log(remote.getGlobal('userPaths'));

*/


const globalPaths = {
    static: {
        root: userDataRoot,
        markdown: path.join(userDataRoot, '/markdown'),
        image: path.join(userDataRoot, '/image'),
        audio: path.join(userDataRoot, '/audio'),
        database: path.join(userDataRoot, '/database')
    },
    relative: {
        root: '/data',
        markdown: '/data/markdown',
        image: '/data/image',
        audio: '/data/audio'
    }
};


//verify paths exist if not create it
for (var key in globalPaths.static) {
    if (globalPaths.static.hasOwnProperty(key)) {
        if (!fs.existsSync(globalPaths.static[key])){
            console.log('making directory');
            fs.mkdirSync(globalPaths.static[key]);
        }
    }
}

globalPaths.static.trueRoot = userDataPath;
global.userPaths = globalPaths;


// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {

    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 800, height: 600});

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/client/index.html');

    // Open the devtools.
    mainWindow.openDevTools();

    client.create(mainWindow);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

});