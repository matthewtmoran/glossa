'use strict';

angular.module('glossa')
    .factory('dialogSrvc', dialogSrvc);

function dialogSrvc($mdDialog) {
    var service = {
        hide: hide,
        manageTags: manageTags,
        attachToNotebook: attachToNotebook,
        cancel: cancel
    };
    return service;

    function hide() {
        $mdDialog.hide();
    }

    function cancel(data) {
        $mdDialog.cancel(data);
    }

    function manageTags() {
        return $mdDialog.show({
            controller: manageTagsCtrl,
            controllerAs: 'dialogVm',
            templateUrl: 'app/tagManagement/manageDialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            bindToController: true,
        }).then(function(data) {
            return data;
        }, function(data) {
            return data;
        });
    }

    function attachToNotebook(ev, currentFile) {
       return $mdDialog.show({
            controller: attachfileCtrl,
            controllerAs: 'atVm',
            templateUrl: 'app/meta/modal/attachfile.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                currentFile: currentFile
            }
        }).then(function(data) {
            return data;
        }, function(data) {
            return data;
        });
    }

}