'use strict';

angular.module('glossa')
    .factory('settingsSrvc', settingsSrvc);

function settingsSrvc($mdDialog) {
    var service = {
        dialogFull: dialogFull
    };

    return service;


    function dialogFull() {

    }




}