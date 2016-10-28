'use strict';

angular.module('glossa')
    .component('metaComponent', {
        controller: metaCtrl,
        controllerAs: 'metaVm',
        templateUrl: 'app/meta/meta.html',
        transclude: true,
        bindings: {
            currentFile: '='
        },
        require: {
            parent: '^^viewerEditorComponent'
        }
    });

function metaCtrl($scope, fileSrvc, $mdDialog) {
    var metaVm = this;

    metaVm.hidden = false;
    metaVm.isOpen = false;
    metaVm.hover = false;
    metaVm.items = [
        { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    metaVm.updateData = updateData;
    metaVm.showAttachDialog = showAttachDialog;
    metaVm.confirmDeleteDialog = confirmDeleteDialog;

    // On opening, add a delayed property which shows tooltips after the speed dial has opened
    // so that they have the proper position; if closing, immediately hide the tooltips
    $scope.$watch('metaVm.isOpen', isOpenWatch);


    /**
     * Update the file's meta data from form
     * @param data - object = {fileId: String, field: String}
     */
    function updateData(data) {
        var changeData = {
            fileId: data.fileId,
            options: {},
            newObj: {},
            field: data.field,
            file: metaVm.currentFile
        };

        changeData['newObj'][data.field] = metaVm.currentFile[data.field];

        fileSrvc.updateFileData(changeData);
    }

    function showAttachDialog(ev) {
        $mdDialog.show({
            controller: attachfileCtrl,
            controllerAs: 'atVm',
            templateUrl: 'app/meta/modal/attachfile.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            bindToController: true,
            locals: {
                currentFile: metaVm.currentFile
            }
        })
            .then(function(answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                $scope.status = 'You cancelled the dialog.';
            });
    }
    function confirmDeleteDialog(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this text file?')
            .textContent('By clicking yes, you confirm to delete everything DIRECTLY associated with this file?')
            .ariaLabel('Delete Text')
            .targetEvent(ev)
            .ok('Yes, Delete')
            .cancel('No, cancel');

        $mdDialog.show(confirm).then(function() {
            $scope.status = 'You decided to get rid of your debt.';
        }, function() {
            $scope.status = 'You decided to keep your debt.';
        });
    };

    function isOpenWatch(isOpen) {
        if (isOpen) {
            $timeout(function() {
                $scope.tooltipVisible = metaVm.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = metaVm.isOpen;
        }
    }

}