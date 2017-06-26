import templateUrl from './root.html';

var BrowserWindow = window.require('electron').remote.getCurrentWindow();

export const rootComponent = {
  templateUrl,
  controller: class RootComponent {
    constructor($window, $timeout, __appData, IpcSerivce) {
      this.$window = $window;
      this.$timeout = $timeout;
      this.appData = __appData;
      this.ipcSerivce = IpcSerivce;

      this.ipcSerivce.on('application:data', (event, data) => {
        console.log('');
        console.log('application:data');
        console.log('data', data);
      })
    }

    $onChanges(changes) {

    }

    $onInit() {
      this.initIpcListeners()


    }

    initIpcListeners() {

      console.log('initIpcListeners')
      // this.ipcSerivce.on('application:data', (event, data) => {
      //   console.log('application:data');
      //   console.log('event', event);
      //   console.log('data', data);
      // })


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
      this.ipcSerivce.send('popupAppMenuEvent');
    }

  },
};
