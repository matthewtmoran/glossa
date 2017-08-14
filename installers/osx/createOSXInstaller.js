const createDMG = require('electron-installer-dmg');
const path = require('path');

getInstallerConfig()
  .then(createDMG)
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1)
  });

function getInstallerConfig() {
  console.log('creating osx installer');

  const rootPath = path.join('./');
  const outPath = path.join(rootPath, 'release-builds');

  console.log(path.join(__dirname, './glossa-logo.ico'));

  return Promise.resolve({
    name:'Glossa',
    icon:  path.join(__dirname, './glossa-logo.png'),
    overwrite: true,
    out: path.join(outPath, 'osx-installer'),
    appPath: path.join(outPath, 'Glossa-darwin-x64/Glossa.app')
    // appDirectory: path.join(outPath, 'Glossa-win32-ia32'),
    // authors: 'Chris Jones, Justin Rees, Matthew Moran',
    // noMsi: true,
    // exe: 'Glossa.exe',
    // description: 'Glossa Application for CLA',
    // setupExe: 'GlossaInstaller.exe',
    // iconUrl: path.join(__dirname, './glossa-logo.ico'),
    // setupIcon: path.join(__dirname, './glossa-logo.ico'),
  })
}


// createDMG(opts, function done (err) { })