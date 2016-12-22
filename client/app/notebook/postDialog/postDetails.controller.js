'use strict';

angular.module('glossa')
    .controller('postDetailsCtrl', postDetailsCtrl);

function postDetailsCtrl($mdDialog, hashtagSrvc, simplemdeOptions, postSrvc, currentNotebook, $scope, $q, simpleSrvc, $timeout) {
    var postVm = this;
    var dialogObject = {
        dataChanged: false,
        event: 'hide',
        data: null
    };
    postVm.notebook = angular.copy(postVm.currentNotebook);
    postVm.isNewPost = false;
    postVm.actionItems = {

    };

    activate();
    function activate() {
        console.log('postVm.currentNotebook', postVm.currentNotebook);
        findDetailType();
        setDynamicItems();
    }








    postVm.cancel = cancel;
    postVm.hide = hide;
    postVm.save = save;
    postVm.editorOptions = simplemdeOptions;

    function cancel() {
        console.log('cancel');
        postVm.notebook = {};
        console.log('postVm.currentNotebook', postVm.currentNotebook);

        $mdDialog.cancel(dialogObject);
    }

    function hide() {
        console.log('hide');
        $mdDialog.hide(dialogObject);
    }

    function save() {
        dialogObject = {
            dataChanged: true,
            event: 'save',
            data: {}
        };
        postSrvc.save[currentNotebook.postType](postVm.notebook).then(function(result) {
            postVm.currentNotebook = {
                media: {}
            };
            dialogObject.data = result;
            $mdDialog.hide(dialogObject);
        });
    }

    function update() {

        console.log('update', postVm.notebook);
    }

    //Hack for issue where simplemde does not display content until editor is clicked; https://github.com/NextStepWebs/simplemde-markdown-editor/issues/344
    function refreshEditor() {
        $timeout(function() {
            simpleSrvc.refreshEditor();
        }, 100);
    }

    function findDetailType() {
        if (!postVm.currentNotebook._id) {
            postVm.isNewPost = true;
        }
    }

    function setDynamicItems() {
        if (postVm.isNewPost) {
            postVm.postDetails = {
                title: 'Create New Post',
                button: {
                    action: save,
                    text: 'Save Post'
                }
            }
        } else {

            postVm.postDetails = {
                title: postVm.currentNotebook.name + ' Details',
                button: {
                    action: update,
                    text: 'Update Post'
                }
            }
        }
    }
}
