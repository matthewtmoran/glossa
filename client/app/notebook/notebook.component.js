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

        docs.forEach(function(doc) {
            nbVm.notebooks.push(buildGridList(doc))
        });
        console.log('docs', docs);

    });

    nbVm.playPauseAudio = playPauseAudio;
    nbVm.newNotebookDialog = newNotebookDialog;

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
    //TODO: need to loop through each doc and add that random col/row dimentions
    function buildGridList(doc) {

        // docs.forEach(function(doc) {
        //     console.log('modifying nb object');
        //     doc.colSpan = randomSpan();
        //     doc.rowspan = randomSpan();
        // });

        doc.colspan = randomSpan();
        doc.rowspan = randomSpan();


        // nbVm.notebooks = (function() {
        //     var nbs = [];
        //     for (var i = 0; i < docs.length; i++) {
        //         nbs.push({
        //             colspan: randomSpan(),
        //             rowspan: randomSpan()
        //         });
        //     }
        //     return nbs;
        // })();
        console.log('returning nb list after mod');
        return doc;
    }

    function randomSpan() {
        var r = Math.random();
        if (r < 0.4) {
            return 1;
        } else if (r < 0.8) {
            return 2;
        } else {
            return 3;
        }
    }
}