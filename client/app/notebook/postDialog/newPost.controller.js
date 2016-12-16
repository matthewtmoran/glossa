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

    // newPostVm.currentNotebook = currentNotebook;
    newPostVm.currentNotebook.potentialTags = newPostVm.currentNotebook.hashtags || [];

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
        //search the description and compare to potential tags
        //remove potential tag if it does not exist in the text
        //

        // newPostVm.potentialTags.forEach(function(tag) {
        //     if (currentNotebook.description.indexOf(tag.tag) > -1) {
        //         if (!currentNotebook.hashtags) {
        //             currentNotebook.hashtags = [];
        //         }
        //         delete tag.$$hashKey;
        //         currentNotebook.hashtags.push(tag);
        //     }
        // });
        postSrvc.save[currentNotebook.postType](newPostVm.currentNotebook).then(function(result) {
            newPostVm.currentNotebook = {
                media: {}
            };
            dialogObject.data = result;
            $mdDialog.hide(dialogObject);
        });
    }
}