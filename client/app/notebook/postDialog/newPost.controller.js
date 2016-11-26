'use strict';

angular.module('glossa')
    .controller('newPostCtrl', newPostCtrl);

function newPostCtrl($mdDialog, notebookSrvc, simplemdeOptions, postSrvc, currentNotebook) {
    var newPostVm = this;

    newPostVm.cancel = cancel;
    newPostVm.hide = hide;
    newPostVm.save = save;
    newPostVm.currentPost = '';
    newPostVm.editorOptions = simplemdeOptions;

    newPostVm.currentNotebook = currentNotebook;

    function cancel() {
        $mdDialog.cancel('cancel');
    }
    function hide() {
        $mdDialog.hide('hide');
    }

    function save() {
        postSrvc.save[currentNotebook.postType](currentNotebook, newPostVm.currentPost).then(function(result) {
            newPostVm.currentNotebook = {
                media: {}
            };
            $mdDialog.hide(result);
        });

    }

}