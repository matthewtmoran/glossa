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

function metaCtrl($scope, fileSrvc, $mdDialog, notebookSrvc, $q, $timeout, hashtagSrvc, postSrvc) {
    var metaVm = this;

    metaVm.hidden = false;
    metaVm.isOpen = false;
    metaVm.hover = false;
    metaVm.attachedMedia = [];
    metaVm.items = [
        { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];
    metaVm.attachedNotebook = {};

    metaVm.updateData = updateData;
    metaVm.showAttachDialog = showAttachDialog;
    metaVm.confirmDeleteDialog = confirmDeleteDialog;
    metaVm.disconnectDialog = disconnectDialog;
    metaVm.editAttachedFile = editAttachedFile;
    metaVm.openExistinDialog = openExistinDialog;

    metaVm.selectHashtag = selectHashtag;
    metaVm.searchHashtags = searchHashtags;

    $scope.$watch('metaVm.isOpen', isOpenWatch);
    $scope.$watch('metaVm.currentFile', queryAttachedNotebook);

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
        }).then(function(data) {
                metaVm.currentFile = data;
            }, function(data) {
                metaVm.currentFile = data;
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
               return fileSrvc.deleteMediaFile(attachment, type, metaVm.currentFile)
            }
            return fileSrvc.unattachNotebook(attachment, metaVm.currentFile);
        }, function() {
            console.log('cancel disconnect');
        });
    }

    function openExistinDialog(notebook) {
        postSrvc.existingPostDialog(notebook).then(function(res) {
            console.log('the response is here', res);
        })
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

    function queryAttachedNotebook() {
        if (metaVm.currentFile.mediaType === 'notebook') {
            notebookSrvc.findNotebook(metaVm.currentFile.notebookId).then(function(result) {
                metaVm.attachedNotebook = result[0];
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

    //mention funcitons

    function searchHashtags(term) {
        var hashtagList = [];
        if (term.length > 1) {
            return hashtagSrvc.searchHastags(term).then(function (response) {
                angular.forEach(response, function(item) {
                    if (item.tag.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                        hashtagList.push(item);
                    }
                });
                metaVm.hashtags = hashtagList;
                return $q.when(hashtagList);
            });
        } else if(hashtagList.length < 2 && term) {

        } else {
            metaVm.hashtags = [];
        }
    }

    function selectHashtag(item) {
        //This is were we will add the tag data to the current notebook/textfile

        // var parent = angular.element('.CodeMirror-line');
        // var element = parent.find('span').text() === $scope.typedTerm;
        // $(element).text(item.tag || item.label);
        // var res = mentionsVm.theTextArea.replace($scope.typedTerm, item.tag || item.label);
        // mentionsVm.theTextArea = res;

        return '#' + (item.tag || item.label);

    }

}