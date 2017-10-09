import templateUrl from './windows-titlebar.html';

var BrowserWindow = window.require('electron').remote.getCurrentWindow();

export const windowsTitlebarComponent = {
  bindings: {
    onPopupAppMenuEvent: '&',
    onMinimize:'&',
    onMaximize:'&',
    onUnmaximize:'&',
    onClose:'&',
    onIsMaximized:'&',
  },
  templateUrl: templateUrl,
  controller: class WindowsTitlebarComponent {
    constructor() {
      'ngInject';
    }

    popupAppMenuEvent(event) {
      this.onPopupAppMenuEvent({
        $event: event
      })
    }

    minimize(event) {
      this.onMinimize({
        $event: event
      })
    }

    maximize(event) {
      this.onMaximize({
        $event: event
      })
    }

    unmaximize(event) {
      this.onUnmaximize({
        $event: event
      })
    }

    close(event) {
      this.onClose({
        $event: event
      })
    }

    isMaximized(event) {
      return BrowserWindow.isMaximized()
      // this.onIsMaximized({
      //   $event: event
      // })
    }


  }
};