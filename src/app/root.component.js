import templateUrl from './root.html';

var BrowserWindow = window.require('electron').remote.getCurrentWindow();
var ipc = window.require('electron').ipcRenderer;

export const rootComponent = {
  templateUrl,
  controller: class RootComponent {
    constructor($window, $timeout, __appData) {
      this.$window = $window;
      this.$timeout = $timeout;
      this.appData = __appData;

      console.log('this.appData', this.appData);
    }

    $onChanges(changes) {
    }

    $onInit() {

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
      console.log('popupAppMenuEvent')
      ipc.send('popupAppMenuEvent');
    }

  },
};
