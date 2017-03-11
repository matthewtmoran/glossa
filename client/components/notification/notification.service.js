'use strict';

angular.module('glossa')
    .factory('Notification', Notification);

function Notification($mdToast, $timeout) {
    var stack = [];
    var debounce;
    var lastMsg;
    var cooldown = 500;


    var service = {
        show: show
    };
    return service;

    function show(options) {
        hideDelay(options, 5000);
        internalShow(basicToast(options));
    }

    function hideDelay(options, delay) {
        if (options.hideDelay == undefined) {
            options.hideDelay = delay;
        }
    }

    /**
     * We defer the showing in case too many toast are created in too little time (seems to be an issue with ng-material).
     *
     * @param toast
     */
    function internalShow(toast) {
        (function () {
            if (lastMsg === toast.locals.message) {
                $timeout.cancel(debounce);
            }
            lastMsg = toast.locals.message;
            debounce = $timeout(function () {
                lastMsg = null;
                // we stack toasts with different msg not showing within 500 millis (cooldown)
                stack.push(toast);
                if (stack.length === 1) {
                    showStacked();
                }
            }, cooldown);
        })();
    }

    function showStacked() {
        if (!stack.length) {
            return;
        }
        var toast = stack[0];
        $mdToast.show(toast).then(function () {
            stack.shift();
            showStacked();
        });
    }

    function basicToast(options) {
        return {
            templateUrl: 'components/notification/notification.html',
            controller: 'toastController',
            controllerAs: 'vm',
            locals: {
                message: options.message
            },
            position: 'top right',
            hideDelay: options.hideDelay
        };
    }
}