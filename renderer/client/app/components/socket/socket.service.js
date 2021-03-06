import io from 'socket.io-client';
export class SocketService {
  constructor($rootScope, $window) {
    'ngInject';
    this.$rootScope = $rootScope;
    this.$window = $window;
  }

  init() {
    let ioRoom = this.$window.location.origin;
    this.$window.socket = io(ioRoom);
    console.log('this.$window.socket:', this.$window.socket)
  }

  on(eventName, callback) {
    this.$window.socket.on(eventName, (...args) => {
      this.$rootScope.$apply(() => {
        callback.apply(this.$window.socket, args);
      });
    })
  }

  emit(eventName, data, callback) {
    this.$window.socket.emit(eventName, data, (...args) => {
      this.$rootScope.$apply(() => {
        if (callback) {
          callback.apply(this.$window.socket, args);
        }
      });
    });
  }

  disconnect() {
    this.$window.socket.disconnect(true);
  }

}