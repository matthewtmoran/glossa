'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

/*

{
    name: String,
        description: String,
    image: {
    name: String,
        path: String,
        description: String,
},
    audio: {
        name: String,
            path: String,
            description: String,
    },
    createdBy: String,
        createdAt: Date,
    isAttached: Boolean,
    attachedToId: String
}

*/

function notebookCtrl(fileSrvc, notebookSrvc, $scope) {
    var nbVm = this;


    nbVm.currentNotebook = {
        media: {}
    };
    nbVm.notebooks = [];

    nbVm.message = 'hello world';

    notebookSrvc.queryNotebooks().then(function(docs) {
        nbVm.notebooks = docs;
    });




    nbVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    nbVm.createNotebook = createNotebook;
    nbVm.playPauseAudio = playPauseAudio;


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



}