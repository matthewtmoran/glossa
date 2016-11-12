'use strict';

angular.module('glossa')
    .controller('addNotebookCtrl', addNotebookCtrl);

function addNotebookCtrl($mdDialog, notebookSrvc) {
    var aNbVm = this;

    aNbVm.currentNotebook = {
        media: {}
    };
    aNbVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    aNbVm.cancel = cancel;
    aNbVm.hide = hide;
    aNbVm.save = save;


    function cancel() {
        $mdDialog.cancel('cancel');
    }

    function hide() {
        $mdDialog.hide('hide');
    }

    function save() {
        notebookSrvc.createNotebook(aNbVm.currentNotebook, function(result) {
            // nbVm.notebooks.push(result);
            aNbVm.currentNotebook = {
                media: {}
            };

            $mdDialog.hide(result);
        });
    }

}
