'use strict';

var util = require('../client/components/node/file.utils');

angular.module('glossa')
    .controller('postDetailsCtrl', postDetailsCtrl);

function postDetailsCtrl($mdDialog, hashtagSrvc, simplemdeOptions, postSrvc, currentNotebook, $scope, $q, simpleSrvc, $timeout, dialogSrvc, notebookSrvc ) {
    var postVm = this;
    var dialogObject = {
        dataChanged: false,
        event: 'hide',
        data: null
    };
    postVm.isNewPost = false;
    postVm.actionItems = {

    };

    activate();
    function activate() {
        postVm.notebook = angular.copy(postVm.currentNotebook);
        findDetailType();
        setDynamicItems();
    }



    postVm.cancel = cancel;
    postVm.hide = hide;
    postVm.save = save;
    postVm.editorOptions = simplemdeOptions;

    function cancel(ev, notebook) {
        if ($scope.addPost.$dirty) {

            if (notebook.media.image && !postVm.currentNotebook.media.image) {
                util.removeItem('uploads/image/'+ notebook.media.image.name).then(function(result) {
                    console.log('item removed', result);
                })
            }
            if (notebook.media.audio && !postVm.currentNotebook.media.audio) {
                util.removeItem('uploads/audio/'+ notebook.media.audio.name).then(function(result) {
                    console.log('item removed', result);
                });
            }
        }

        postVm.notebook = {};

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

        return notebookSrvc.save(postVm.notebook).then(function(result) {
            dialogObject.data = result;
            $mdDialog.hide(dialogObject);
        });
    }

    function update() {
        return notebookSrvc.update(postVm.notebook).then(function(result) {
            dialogObject = {
                dataChanged: true,
                event: 'update',
                data: {}
            };
            dialogObject.data = result.data;
            $mdDialog.hide(dialogObject)
        });
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
