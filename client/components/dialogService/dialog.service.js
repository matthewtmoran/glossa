'use strict';

angular.module('glossa')
    .factory('dialogSrvc', dialogSrvc);

function dialogSrvc($mdDialog) {
    var service = {
        hide: hide,
        manageTags: manageTags,
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

}