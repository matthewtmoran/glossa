'use strict';

angular.module('glossa')
    .controller('newPostCtrl', newPostCtrl);

function newPostCtrl($mdDialog, notebookSrvc) {
    var newPostVm = this;

    newPostVm.cancel = cancel;
    newPostVm.hide = hide;
    newPostVm.save = save;
    newPostVm.parseTitle = parseTitle;
    newPostVm.currentPost = '';

    newPostVm.currentNotebook = {
        media: {}
    };



    function parseTitle(text) {
        var re = /(#+)\s(.*)/;

        var m = text.match(re);

        return m[0];

        // newPostVm.currentNotebook.title = text.match(re);
    }


    function cancel() {

       console.log(parseTitle(newPostVm.currentPost));

        $mdDialog.cancel('cancel');
    }

    function hide() {
        $mdDialog.hide('hide');
    }

    function save() {
        newPostVm.currentNotebook.name = parseTitle(newPostVm.currentPost);
        newPostVm.currentNotebook.description = newPostVm.currentPost;

        notebookSrvc.createNotebook(newPostVm.currentNotebook, function(result) {
            // nbVm.notebooks.push(result);
            newPostVm.currentNotebook = {
                media: {}
            };

            $mdDialog.hide(result);
        });
    }
}