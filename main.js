const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
// const userData = app.getPath('userData');
// const uploadPath = path.join(userData + '/uploads');
var path = require('path'),
    fs = require('fs');

var mainWindow = null;



// console.log('User Data', uData);
// console.log('uploadPath', uploadPath);
//
// if (!fs.existsSync(uploadPath)){
//     fs.mkdirSync(uploadPath);
// }


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
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

});