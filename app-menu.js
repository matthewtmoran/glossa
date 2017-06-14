var electron = require('electron'),
  app = electron.app,
  Menu = electron.Menu,
  MenuItem = electron.MenuItem,
  BrowserWindow = electron.BrowserWindow,
  ipcMain = electron.ipcMain;
var eventActions = require('./app-actions');


const isDarwin = process.platform === 'darwin';
const isWin10 = process.platform === 'win32';

let menu;

function buildMenu(browserWindow) {
  let template;

  if (isDarwin) {
    template = buildMacMenu();
  }
  if (isWin10) {
    template = buildWin10Menu();
  }
  menu = Menu.buildFromTemplate(template);

  if (!isDarwin) {
    browserWindow.setMenu(menu);
  } else {
    Menu.setApplicationMenu(this.menu);
  }
}


ipcMain.on('popupAppMenuEvent', popupAppMenuEvent);

function buildGlossaMenu() {
  const menu = {
    label: 'Glossa',
    submenu: [buildAboutBoxMenu(), {
      type: 'separator'
    }, buildPreferencesMenuItem(), {
      type: 'separator'
    }, buildQuitMenuItem()]
  };
  return menu;
}

function buildFileMenu() {
  return isDarwin ? {
    label: 'File',
    submenu: [buildCloseMenuItem()]
  } : {
    label: 'File',
    submenu: [
      buildPreferencesMenuItem(),
      {type: 'separator'},
      buildImportMenuItem(),
      buildQuitMenuItem()
    ]
  };
}

function buildEditMenu() {
  const menu = {
    label: 'Edit',
    submenu: [{
      role: 'undo',
      accelerator: 'CmdOrCtrl+Z'
    }, {
      role: 'redo',
      accelerator: isDarwin ?
        'Command+Shift+Z' :
        'Ctrl+Y'
    }, {
      type: 'separator'
    }, {
      role: 'cut',
      accelerator: 'CmdOrCtrl+X'
    }, {
      role: 'copy',
      accelerator: 'CmdOrCtrl+C'
    }, {
      role: 'paste',
      accelerator: 'CmdOrCtrl+V'
    }, {
      role: 'pasteandmatchstyle',
      accelerator: 'CmdOrCtrl+Shift+V'
    }, {
      role: 'delete'
    }, {
      role: 'selectall',
      accelerator: 'CmdOrCtrl+A'
    }, {
      type: 'separator'
    }]
  };

  // menu.submenu.push(buildFindMenuItem());
  return menu;
}

function buildViewMenu() {
  const menu = {
    label: 'View',
    submenu: [{
      label: 'Reload',
      click: () => eventActions.reload(),
      accelerator: 'CmdOrCtrl+R'
    }, {
      label: 'Reload All',
      click: () => eventActions.reloadAll(),
      accelerator: 'CmdOrCtrl+shift+R'
    },
      {
        type: 'separator'
      }, {
        label: 'Toggle &Full Screen',
        click: eventActions.toggleFullScreen,
        accelerator: isDarwin ?
          'Command+Control+F' :
          'Control+Shift+F'
      }, {
        type: 'separator'
      }, {
        label: 'Actual Size',
        // click: settingActions.resetZoom,
        accelerator: 'CmdOrCtrl+0'
      }, {
        label: 'Zoom In',
        // click: settingActions.zoomIn,
        accelerator: 'CmdOrCtrl+Plus'
      }, {
        label: 'Zoom Out',
        // click: settingActions.zoomOut,
        accelerator: 'CmdOrCtrl+-'
      }]
  };
  return menu;
}

function buildHistoryMenu() {

}

function buildWindowMenu() {
  const menu = {
    label: 'Window',
    role: 'window',
    submenu: []
  };

  let startWithSeparator = true;

  if (isDarwin) {
    menu.submenu.unshift(buildMacWindowItems());
  } else if (!isWin10) {
    menu.submenu.unshift(buildWinLinuxWindowItems());
  } else {
    startWithSeparator = false;
  }

  return menu;
}

function buildHelpMenu() {
  const fileManager = isDarwin ?
    'Finder' : process.platform === 'win32' ?
      'Explorer' :
      'File Manager';

  const menu = {
    label: '&Help',
    role: 'help',
    submenu: [{
      label: 'Keyboard Shortcuts',
      // click: () => eventActions.showWebappDialog('shortcuts'),
      accelerator: 'CmdOrCtrl+/'
    }, {
      label: 'Open Help Center',
      // click: () => shell.openExternal('https://get.slack.help'),
    }, {
      type: 'separator'
    }, {
      label: 'Report Issue…',
      // click: eventActions.reportIssue
    }, {
      type: 'separator'
    }, {
      label: "What's &New…",
      // click: eventActions.showReleaseNotes
    }]
  };

  //non mac os system lacks of `slack` menu, and `about slack` menu is belong to help menu instead
  if (!isDarwin) {
    const aboutBoxMenu = buildAboutBoxMenu();
    // aboutBoxMenu.position = `after=${MENU_ITEM_ID.RELEASE_NOTES}`;
    menu.submenu.push(aboutBoxMenu);
  }

  return menu;
}

function buildAboutBoxMenu() {
  return {
    label: 'About Glossa',
    click: () => eventActions.navigateToState('about'),
  };
}

function buildPreferencesMenuItem() {
  return {
    label: 'Settings…',
    click: () => eventActions.navigateToState('project'),
    accelerator: 'CmdOrCtrl+,'
  };
}

function buildCloseMenuItem() {
  return {
    role: 'close',
    accelerator: 'CmdOrCtrl+W'
  };
}

function buildQuitMenuItem() {
  return {
    label: 'Quit',
    click: eventActions.quitApp,
    accelerator: 'CmdOrCtrl+Q'
  };
}

function buildFindMenuItem() {
  // return isDarwin ? {
  // label: 'Find',
  // submenu: [{
  //   label: 'Find…',
  //   click: () => eventActions.editingCommand('find'),
  //   accelerator: 'Command+F'
  // }, {
  //   label: 'Use Selection for Find',
  //   click: () => eventActions.editingCommand('use-selection-for-find'),
  //   accelerator: 'Command+E'
  // }]
  // } : {
  //   label: 'Find…',
  //   click: () => eventActions.editingCommand('find'),
  // accelerator: 'Control+F'
  // };
}

function buildMacWindowItems() {
  return [{
    role: 'minimize'
  }, {
    role: 'zoom'
  }, {
    type: 'separator'
  }, {
    role: 'front'
  }];
}

function buildWinLinuxWindowItems() {
  // const autoHideMenuBar = this.state.autoHideMenuBar;
  return {
    label: 'Always Show Menu Bar',
    // click: () => settingActions.updateSettings({
    //   autoHideMenuBar: !autoHideMenuBar
    // }),
    type: 'checkbox',
    // checked: !autoHideMenuBar
  };
}

function buildWin10Menu() {
  const menu = [
    buildFileMenu(),
    buildEditMenu(),
    buildViewMenu(),
    buildHelpMenu()
  ];
  return menu;
}

function buildMacMenu() {
  const menu = [
    buildGlossaMenu(),
    buildFileMenu(),
    buildEditMenu(),
    buildViewMenu(),
    buildHelpMenu()
  ];
  return menu;
}

function buildImportMenuItem() {
  return {
    label: 'Load Project',
    click: eventActions.importProject
  }
}

function popupAppMenuEvent(invokedViaKeyboard) {
  console.log('popupAppMenuEvent')
  // if (invokedViaKeyboard && browserWindow && !browserWindow.isDestroyed()) {
  //   try {
  //     menu.popup({x: 20, y: 15, async: true});
  //   } catch (error) {
  //     // Try again, but don't try to do it on a specific window
  //     menu.popup(undefined, {async: true} as any);
  //   }
  // } else {
  menu.popup({async: true});
  // }
}

module.exports = {
  buildMenu: buildMenu
};