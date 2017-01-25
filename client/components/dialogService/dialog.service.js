'use strict';

angular.module('glossa')
    .factory('dialogSrvc', dialogSrvc);

function dialogSrvc($mdDialog) {
    var service = {
        hide: hide,
        cancel: cancel,
        manageTags: manageTags,
        mediaAttachment: mediaAttachment,
        settingsFull: settingsFull,
        corpusDialog: corpusDialog,
        confirmDialog: confirmDialog,
        notebookDetails: notebookDetails,
        viewDetails: viewDetails
    };
    return service;

    function hide(data) {
        $mdDialog.hide(data);
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

    function mediaAttachment(ev, currentFile) {
       return $mdDialog.show({
            controller: attachmentCtrl,
            controllerAs: 'atVm',
            templateUrl: 'app/meta/attachment/attachment.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                currentFile: currentFile
            }
        }).then(function truthyAction(data) {
            return data;
        }, function falsyAction(data) {
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
            return data;
        }).catch(function(data) {
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

        return $mdDialog.show(confirm)
            .then(function(data) {
                return data || true;
            })
            .catch(function(data) {
                return data || false;
            });
    }

    function notebookDetails(ev, options, notebook) {
        return $mdDialog.show({
            controller: notebookDetailsCtrl,
            controllerAs: 'dialogVm',
            templateUrl: options.template,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                simplemdeOptions: options.simplemde,
                notebook: notebook
            }
        }).then(function(data) {

            return data;
        }).catch(function(data) {
            return data;
        });
    }

    function viewDetails(ev, options, notebook) {
        return $mdDialog.show({
            controller: notebookDetailsCtrl,
            controllerAs: 'dialogVm',
            templateUrl: 'app/notebook/notebookDetails/view-notebook-details.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                simplemdeOptions: options.simplemde,
                notebook: notebook
            }
        }).then(function(data) {

            return data;
        }).catch(function(data) {
            return data;
        });
    }


}