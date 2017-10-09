export class NotificationService {
  constructor($mdToast, $timeout) {
    'ngInject';

    this.$mdToast = $mdToast;
    this.$timeout = $timeout;
    this.stack = [];
    this.debounce;
    this.lastMsg;
    this.cooldown = 500;

  }

  show(options) {
    this.hideDelay(options, 5000);
    this.internalShow(this.basicToast(options));
  };

  showStacked() {
    if (!this.stack.length) {
      return;
    }
    let toast = this.stack[0];

    let staticToast = this.$mdToast.simple()
      .textContent(toast.message)
      .hideDelay(toast.hideDelay)
      .position(toast.position)
      .action(toast.action || 'Okay');


    this.$mdToast.show(staticToast).then(() => {
      this.stack.shift();
      this.showStacked();
    });
  };

  hideDelay(options, delay) {
    if (options.hideDelay == undefined) {
      options.hideDelay = delay;
    }
  };

  internalShow(toast) {
    (() => {
      if (this.lastMsg === toast.message) {
        this.$timeout.cancel(this.debounce);
      }
      this.lastMsg = toast.message;
      this.debounce = this.$timeout(() => {
        this.lastMsg = null;
        // we stack toasts with different msg not showing within 500 millis (cooldown)
        this.stack.push(toast);
        if (this.stack.length === 1) {
          this.showStacked();
        }
      }, this.cooldown);
    })();
  };

  basicToast(options) {
    return {
      template: `<md-toast>
	                  <span flex>${options.message}</span>
                  </md-toast>`,
      message: options.message,
      position: 'top right',
      hideDelay: options.hideDelay,
    };
  }

  syncToast(options) {
    return {
      template: `<md-toast>
                    <span flex>${options.message}</span>
                    <md-button class="md-highlight" ng-click="closeToast($event)">
                        More info
                    </md-button>
                 </md-toast>`
    }
  }

  closeToast(event) {
    this.$mdToast.hide();
  }

}
