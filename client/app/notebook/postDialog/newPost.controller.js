'use strict';

angular.module('glossa')
    .controller('newPostCtrl', newPostCtrl);

function newPostCtrl($mdDialog, hashtagSrvc, simplemdeOptions, postSrvc, currentNotebook, $scope, $q) {
    var newPostVm = this;
    var dialogObject = {
        dataChanged: false,
        event: 'hide',
        data: null
    };
    newPostVm.cancel = cancel;
    newPostVm.hide = hide;
    newPostVm.save = save;
    newPostVm.editorOptions = simplemdeOptions;

    function cancel() {
        $mdDialog.cancel(dialogObject);
    }
    function hide() {
        $mdDialog.hide(dialogObject);
    }

    function save() {
        dialogObject = {
            dataChanged: true,
            event: 'save',
            data: {}
        };

        postSrvc.save[currentNotebook.postType](newPostVm.currentNotebook).then(function(result) {
            newPostVm.currentNotebook = {
                media: {}
            };
            dialogObject.data = result;
            $mdDialog.hide(dialogObject);
        });
    }
}