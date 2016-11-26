'use strict';

angular.module('glossa')
    .controller('imagePost', imagePost);

function imagePost($mdDialog, notebookSrvc) {
    var newPostVm = this;

    newPostVm.cancel = cancel;
    newPostVm.hide = hide;
    newPostVm.save = save;
    newPostVm.currentPost = '';
    newPostVm.editorOptions = {
        toolbar: false
    };

    newPostVm.currentNotebook = {
        media: {}
    };

    function cancel() {
        $mdDialog.cancel('cancel');
    }

    function hide() {
        $mdDialog.hide('hide');
    }

    function save() {
        newPostVm.currentNotebook.name = newPostVm.currentNotebook.media.image.name;
        notebookSrvc.createNotebook(newPostVm.currentNotebook, function(result) {
            newPostVm.currentNotebook = {
                media: {}
            };
            $mdDialog.hide(result);
        });
    }



}