import templateUrl from './root.html';

var BrowserWindow = window.require('electron').remote.getCurrentWindow();

export const rootComponent = {
  templateUrl,
  controller: class RootComponent {
    constructor($window, $timeout, __appData, IpcSerivce, $scope) {
      this.$window = $window;
      this.$timeout = $timeout;
      this.appData = __appData;
      this.ipcSerivce = IpcSerivce;
      this.$scope = $scope;
    }

    minimize() {
      BrowserWindow.minimize();
    };

    maximize() {
      BrowserWindow.maximize();
    }

    unmaximize() {
      BrowserWindow.isFullScreen() ? BrowserWindow.setFullScreen(false) : BrowserWindow.unmaximize();
    }

    close() {
      BrowserWindow.close();
    }

    isMaximized() {
        return BrowserWindow.isMaximized()
    }

    popupAppMenuEvent() {
      this.ipcSerivce.send('popupAppMenuEvent');
    }

  },
};
