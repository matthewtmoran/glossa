'use strict';

angular.module('glossa')
    .factory('dialogSrvc', dialogSrvc);

function dialogSrvc($mdDialog) {
    var service = {
        hide: hide,
        manageTags: manageTags,
        attachToNotebook: attachToNotebook,
        cancel: cancel,
        settingsFull: settingsFull,
        corpusDialog: corpusDialog,
        confirmDialog: confirmDialog,
        openPostDialog: openPostDialog
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
            controllerAs: 'tagVm',
            templateUrl: 'app/tagManagement/manageDialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            // bindToController: true,
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

    function settingsFull() {

        return $mdDialog.show({
            controller: settingsCtrl,
            controllerAs: 'sVm',
            templateUrl: 'components/settings/settings.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            bindToController: true,
            fullscreen: true

        }).then(function(data) {
            console.log('close on save?', data);
        }).catch(function(data) {
            console.log('close on cancel or hide?', data);
        });

    }

    function corpusDialog() {
        $mdDialog.show({
            templateUrl: 'components/drawer/dialogs/corpusDialog.html',
            parent: angular.element(document.body),
            // targetEvent: ev,
            controller: corpusDialogCtrl,
            controllerAs: 'dialogVm',
            bindToController: true,
            clickOutsideToClose: false,
        }).then(function(data) {

            console.log('corpusDialog is closed. data', data);

            return data;
        }).catch(function(data) {
            console.log('corpusDialog is closed. data', data);
            return data;
        });
    }

    function confirmDialog(options) {

        var confirm = $mdDialog.confirm()
            .title(options.title || 'Are you sure you want to do this?' )
            .textContent(options.textContent || 'This will change things....')
            .ariaLabel('Confirm Dialog')
            .ok(options.okBtn || 'Yes')
            .cancel(options.cancelBtn || 'Cancel');

        return $mdDialog.show(confirm).then(function(data) {
            console.log('Yes selection', data);
            return data;
        }).catch(function(data) {
            console.log('Cancel selection', data);
            return data;
        });

    }

    function openPostDialog(ev, options, currentNotebook) {
        return $mdDialog.show({
            controller: postDetailsCtrl,
            controllerAs: 'postVm',
            templateUrl: options.template,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                simplemdeOptions: options.simplemde,
                currentNotebook: currentNotebook
            }
        }).then(function(data) {

            console.log('Dialog is saved. data', data);

            return data;
        }).catch(function(data) {
            console.log('Dialog is canceled', data);
            return data;
        });
    }

}