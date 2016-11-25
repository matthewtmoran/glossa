'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

function notebookCtrl(fileSrvc, notebookSrvc, $scope, $mdDialog, $timeout) {
    var nbVm = this;

    nbVm.hidden = false;
    nbVm.isOpen = false;
    nbVm.hover = false;
    nbVm.items = [
        { name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio' },
        { name: "Create Image Post", icon: "add_a_photo", direction: "left", type: 'image' },
        { name: "Create Normal Post", icon: "create", direction: "left", type: 'normal' }
    ];

    $scope.$watch('nbVm.isOpen', isOpenWatch);
    function isOpenWatch(isOpen) {
        if (isOpen) {
            $timeout(function() {
                $scope.tooltipVisible = nbVm.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = nbVm.isOpen;
        }
    }

    nbVm.currentNotebook = {
        media: {}
    };
    nbVm.notebooks = [];

    notebookSrvc.queryNotebooks().then(function(docs) {
        nbVm.notebooks = docs;
    });

    nbVm.playPauseAudio = playPauseAudio;
    nbVm.newNotebookDialog = newNotebookDialog;
    nbVm.openNBDialog = openNBDialog;

    function playPauseAudio(notebook) {
        console.log('notebook to play audio', notebook);
    }
    function newNotebookDialog(ev) {
        $mdDialog.show({
            controller: addNotebookCtrl,
            controllerAs: 'aNbVm',
            templateUrl: 'app/notebook/addNotebookDialog/addNotebook.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            bindToController: true,
        }).then(function(data) {
            nbVm.notebooks.push(data);

        }, function(data) {

            console.log('closed 2', data);
        });
    }

    function openNBDialog(type) {
        switch(type) {
            case 'image':
                openImageDialog();
                break;
            case 'audio':
                openAudioDialog();
                break;
            case 'normal':
                openPostDialog();
        }
    }

    function openPostDialog(ev) {
        $mdDialog.show({
            controller: newPostCtrl,
            controllerAs: 'newPostVm',
            templateUrl: 'app/notebook/postDialog/newPost.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                currentFile: nbVm.currentFile
            }
        }).then(function(data) {
            nbVm.notebooks.push(data);
        }, function(data) {

        });
    }
}