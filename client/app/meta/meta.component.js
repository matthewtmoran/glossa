'use strict';

var remote = require('electron').remote,
    path = require('path'),
    globalPaths = remote.getGlobal('userPaths');

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

function metaCtrl($scope, fileSrvc, $mdDialog, notebookSrvc, $q, $timeout, hashtagSrvc, postSrvc, dialogSrvc, simpleParse) {
    var metaVm = this;

    metaVm.hidden = false;
    metaVm.isOpen = false;
    metaVm.hover = false;
    metaVm.attachedMedia = [];
    metaVm.attachedNotebook = {};
    metaVm.items = [
        { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];
    metaVm.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        forceSync: true,
        placeholder: 'Description...',
        updateFunction: newUpdate
    };

    metaVm.updateData = updateData;
    metaVm.newUpdate = newUpdate;
    metaVm.confirmDeleteDialog = confirmDeleteDialog;
    metaVm.disconnectDialog = disconnectDialog;
    metaVm.editAttachedFile = editAttachedFile;
    metaVm.openNBDialog = openNBDialog;
    metaVm.newAttachDialog = newAttachDialog;

    $scope.$watch('metaVm.isOpen', isOpenWatch);
    $scope.$watch('metaVm.currentFile', queryAttachedNotebook);

    $scope.$on('update:meta-description', newUpdate('description'));


    //I believe this is the one we use...
    function newUpdate(field) {

        $q.when(simpleParse.findHashtags(metaVm.currentFile.description)).then(function(result) {

            metaVm.currentFile.hashtags = [];
            result.forEach(function(tag) {
                metaVm.currentFile.hashtags.push(tag);
            });


            fileSrvc.newUpdate(metaVm.currentFile, field).then(function(result) {
                if (!result.success) {
                    return console.log('TODO: show user the update was unsuccessful and handle errors');
                }

                // console.log('TODO: show user the update was successful', result);
            })

        });
    }


    //TODO: remove this?
    /**
     * Update the file's meta data from form
     * @param data - object = {fileId: String, field: String}
     */
    function updateData(data) {
        console.log('metaComponent: updateData', data);
        var changeData = {
            fileId: data.fileId,
            options: {},
            newObj: {},
            field: data.field,
            file: metaVm.currentFile
        };

        changeData['newObj'][data.field] = metaVm.currentFile[data.field];

        fileSrvc.updateFileData(changeData).then(function(doc) {
            metaVm.currentFile[data.field] = doc.data[data.field];

            if (data.field === 'name') {
                metaVm.currentFile.path = doc.data.path;
            }
        });
    }


    //DIALOGS

    /**
     * This function opens the attach dialog.
     * @param ev - this is the event object
     * The result will be returned whether an item is attached or not.
     */
    function newAttachDialog(ev) {
        dialogSrvc.attachToNotebook(ev, metaVm.currentFile).then(function(result) {
            metaVm.currentFile = result;
        });
    }

    function confirmDeleteDialog(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete this text file?')
            .textContent('By clicking yes, you confirm to delete all independently attached media files associated with this file?')
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
        var title,
            textContent;
        if (type) {
            title = 'Are you sure you want to disconnect this media attachment?';
            textContent = 'By clicking yes you will remove this media attachment from the application';
        } else {
            title = 'Are you sure you want to disconnect this notebook?';
            textContent = 'By clicking yes, you will disconnect the Notebook and it\'s associated media from this file.';
        }

        var confirm = $mdDialog.confirm()
            .title(title)
            .textContent(textContent)
            .ariaLabel('Disconnect attachment')
            .targetEvent(ev)
            .ok('Yes, Disconnect')
            .cancel('No, cancel');

        $mdDialog.show(confirm).then(function() {
            if (type) {
              return fileSrvc.deleteMediaFile(attachment, type, metaVm.currentFile).then(function(result) {
                  metaVm.currentFile = result.data;
               })
            }
            return fileSrvc.unattachNotebook(attachment, metaVm.currentFile);
        }, function() {
            console.log('cancel disconnect');
        });
    }

    function openNBDialog(ev, notebook) {
        var postOptions = postSrvc.postOptions(ev, notebook);

        dialogSrvc.openPostDialog(ev, postOptions, notebook).then(function(result) {
            if (result && !result.dataChanged) {
                return;
            }
            queryAttachedNotebook();
        }).catch(function(result) {
            console.log('error', result);
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


    //Queryies the attached notebook data
    function queryAttachedNotebook() {

        if (metaVm.currentFile.mediaType === 'notebook') {
            notebookSrvc.find(metaVm.currentFile.notebookId).then(function(result) {
                metaVm.attachedNotebook = result.data[0];
                if (metaVm.attachedNotebook.media.image) {
                    metaVm.imagePath = path.join(globalPaths.static.trueRoot, metaVm.attachedNotebook.media.image.path);
                }
                if (metaVm.attachedNotebook.media.audio) {
                    metaVm.audioPath = path.join(globalPaths.static.trueRoot, metaVm.attachedNotebook.media.audio.path);
                }
            })
        }

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