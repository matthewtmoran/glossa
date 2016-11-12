'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

function notebookCtrl(fileSrvc, notebookSrvc, $scope, $mdDialog) {
    var nbVm = this;
    console.log('notebookCtrl');

    nbVm.currentNotebook = {
        media: {}
    };
    nbVm.notebooks = [];

    notebookSrvc.queryNotebooks().then(function(docs) {
        nbVm.notebooks = docs;
    });

    nbVm.createNotebook = createNotebook;
    nbVm.playPauseAudio = playPauseAudio;
    nbVm.newNotebookDialog = newNotebookDialog;

    function createNotebook() {
        notebookSrvc.createNotebook(nbVm.currentNotebook, function(result) {
            nbVm.notebooks.push(result);
            nbVm.currentNotebook = {
                media: {}
            };
        });
    }

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

}