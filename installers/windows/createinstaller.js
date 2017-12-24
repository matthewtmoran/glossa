const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller;
const path = require('path');

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1)
  });

function getInstallerConfig () {
  console.log('creating windows installer');
  const rootPath = path.join('./');
  const outPath = path.join(rootPath, 'release-builds');

  console.log(path.join(__dirname, './glossa-logo.ico'));

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Glossa-win32-ia32'),
    authors: 'Chris Jones, Justin Rees, Matthew Moran',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'Glossa.exe',
    description: 'Glossa Application for CLA',
    setupExe: 'GlossaInstaller.exe',
    iconUrl: path.join(__dirname, './glossa-logo.ico'),
    setupIcon: path.join(__dirname, './glossa-logo.ico'),
  })
}