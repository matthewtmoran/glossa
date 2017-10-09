//@electron-run
var ipcRenderer = window.require('electron').ipcRenderer;
export class IpcSerivce {
  constructor($rootScope, $window) {
    'ngInject';
    this.$rootScope = $rootScope;
  }

  broadcastData(event, data) {

  }

  on(eventName, callback) {
    ipcRenderer.on(eventName, (...args) => {
      this.$rootScope.$apply(() => {
        callback.apply(ipcRenderer, args);
      });
    })
  }

  send(eventName, data) {
    ipcRenderer.send(eventName, data);
  }

}