'use strict';

angular.module('glossa')
    .controller('toastController', toastController);

function toastController($mdToast, message) {
    var vm = this;

    vm.message = message;
    vm.close = close;

    function close() {
        $mdToast.hide();
    }
}