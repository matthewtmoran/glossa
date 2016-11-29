'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

function notebookCtrl(fileSrvc, notebookSrvc, $scope, $mdDialog, $timeout, postSrvc) {
    var nbVm = this;

    nbVm.hidden = false;
    nbVm.isOpen = false;
    nbVm.hover = false;
    nbVm.items = [
        { name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio' },
        { name: "Create Image Post", icon: "add_a_photo", direction: "left", type: 'image' },
        { name: "Create Normal Post", icon: "create", direction: "left", type: 'normal' }
    ];
    nbVm.currentNotebook = {
        media: {}
    };
    nbVm.notebooks = [];

    nbVm.playPauseAudio = playPauseAudio;
    nbVm.openNBDialog = openNBDialog;
    nbVm.openExistinDialog = openExistinDialog;

    $scope.$watch('nbVm.isOpen', isOpenWatch);

    notebookSrvc.queryNotebooks().then(function(docs) {
        nbVm.notebooks = docs;
    });

    function playPauseAudio(notebook) {
        console.log('notebook to play audio', notebook);
    }

    /**
     * Calls the service method and waits for promise.  When promise returns, it means the data has been saved in the database and the file has been written to the filesystem then we push the created notebook to the array
     * @param ev - the event
     * @param type - the type of post
     */
    function openNBDialog(ev, type) {
        postSrvc.newPostDialog(ev, type, nbVm.currentNotebook).then(function(res) {
            nbVm.currentNotebook = {
                media: {}
            };
            if (typeof res !== 'string') {
                return nbVm.notebooks.push(res);
            }
             return console.log('this was not saved', res);
        });
    }

    function openExistinDialog(notebook) {
        postSrvc.existingPostDialog(notebook).then(function(res) {
            console.log('the response is here', res);
        })
    }

    function isOpenWatch(isOpen) {
        if (isOpen) {
            $timeout(function() {
                $scope.tooltipVisible = nbVm.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = nbVm.isOpen;
        }
    }
}