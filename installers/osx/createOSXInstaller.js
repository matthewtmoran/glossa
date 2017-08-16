const createDMG = require('electron-installer-dmg');
const path = require('path');
const rootPath = path.join('./');
const outPath = path.join(rootPath, 'release-builds');

const opts = {
  appPath: path.join(outPath, 'Glossa-darwin-x64/Glossa.app'),
  name:'Glossa',
  icon:  path.join(__dirname, './glossa-logo.png'),
  overwrite: true,
  out: path.join(outPath, 'osx-installer')
};

createDMG(opts, function done (err) {
  if (err) {
    console.log('Error making osx dmg', err)
  }
})

