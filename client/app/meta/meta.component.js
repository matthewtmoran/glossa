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
    metaVm.attachedMedia = [];
    metaVm.items = [
        { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    metaVm.updateData = updateData;
    metaVm.showAttachDialog = showAttachDialog;
    metaVm.confirmDeleteDialog = confirmDeleteDialog;
    metaVm.disconnectDialog = disconnectDialog;
    metaVm.editAttachedFile = editAttachedFile;

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

        fileSrvc.updateFileData(changeData).then(function(doc) {
            metaVm.currentFile[data.field] = doc[data.field];

            if (data.field === 'name') {
                metaVm.currentFile.path = doc.path;
            }
        });
    }
    function showAttachDialog(ev) {
        $mdDialog.show({
            controller: attachfileCtrl,
            controllerAs: 'atVm',
            templateUrl: 'app/meta/modal/attachfile.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                currentFile: metaVm.currentFile
            }
        }).then(function(answer) {
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
            fileSrvc.deleteTextFile(metaVm.currentFile).then(function() {

            $scope.$emit('remove:textFile', metaVm.currentFile);

            })
        }, function() {
            console.log("don't delete file")
        });
    };
    function disconnectDialog(ev, attachment, type) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to disconnect this media attachment?')
            .textContent('By clicking yes you will remove this media attachment from the application')
            .ariaLabel('Disconnect attachment')
            .targetEvent(ev)
            .ok('Yes, Disconnect')
            .cancel('No, cancel');

        $mdDialog.show(confirm).then(function() {
            fileSrvc.deleteMediaFile(attachment, type, metaVm.currentFile)
        }, function() {
            console.log('cancel disconnect');
        });
    }
    function editAttachedFile(ev, attachment, type) {
        $mdDialog.show({
            controller: editAttached,
            controllerAs: 'edVm',
            templateUrl: 'app/meta/editAttachedDialog/editAttached.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            bindToController: true,
            locals: {
                currentFile: metaVm.currentFile,
                attachment: attachment,
                attachedType: type
            }
        })
            .then(function(answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
                $scope.status = 'You cancelled the dialog.';
            });
    }

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