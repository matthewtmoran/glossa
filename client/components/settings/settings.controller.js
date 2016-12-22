'use strict';

angular.module('glossa')
    .controller('settingsCtrl', settingsCtrl);


function settingsCtrl($mdDialog) {
    var sVm = this;
    var returnObj;


    sVm.activate = activate;
    sVm.cancel = cancel;
    sVm.hide = hide;
    sVm.save = save;

    activate();
    function activate() {
    //    init functions
        console.log('this is the settings controller');
    }


    function cancel() {
        returnObj = {
            date: null,
            msg: 'dialog canceled',
            eventType: 'cancel'
        };
        $mdDialog.cancel(returnObj);
    }

    function hide() {
        returnObj = {
            date: null,
            msg: 'dialog hidden',
            eventType: 'hide'
        };
        $mdDialog.hide(returnObj);
    }

    function save() {
        returnObj = {
            date: null,
            msg: 'dialog saved',
            eventType: 'save'
        };
        $mdDialog.hide(returnObj);
    }





}