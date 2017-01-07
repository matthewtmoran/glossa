'use strict';


angular.module('glossa')
    .controller('postDetailsCtrl', postDetailsCtrl);

function postDetailsCtrl($mdDialog, simplemdeOptions, $scope, notebookSrvc, $http, Upload) {
    var postVm = this;

    var dialogObject = {
        dataChanged: false,
        event: 'hide',
        data: null
    };
    postVm.isNewPost = false;
    postVm.cancel = cancel;
    postVm.hide = hide;
    postVm.save = save;
    postVm.editorOptions = simplemdeOptions;
    postVm.removeMedia = removeMedia;
    postVm.removedMedia = [];
    init();
    function init() {
        postVm.notebook = angular.copy(postVm.currentNotebook);
        findDetailType();
        setDynamicItems();
    }

    function cancel(ev, notebook) {
        if ($scope.postForm.$dirty) {

            console.log('TODO: remove preview if image/audio is not uploaded....');

            // if (notebook.media.image && !postVm.currentNotebook.media.image) {
            //     util.removeItem('uploads/image/'+ notebook.media.image.name).then(function(result) {
            //         console.log('item removed', result);
            //     })
            // }
            // if (notebook.media.audio && !postVm.currentNotebook.media.audio) {
            //     util.removeItem('uploads/audio/'+ notebook.media.audio.name).then(function(result) {
            //         console.log('item removed', result);
            //     });
            // }
        }

        postVm.notebook = {};

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

        return notebookSrvc.createNotebook(postVm.notebook).then(function(result) {
            dialogObject.data = result;
            $mdDialog.hide(dialogObject);
        });
    }

    function update() {
        if (postVm.removedMedia.length > 0) {
            postVm.notebook.removeItem = postVm.removedMedia;
        }
        return notebookSrvc.updateNotebook(postVm.notebook).then(function(data) {
            dialogObject = {
                dataChanged: true,
                event: 'update',
                data: {}
            };
            dialogObject.data = data;
            $mdDialog.hide(dialogObject)
        });
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
    function removeMedia(media) {
        if (media.createdAt) {
            postVm.removedMedia.push(media);
        }
    }

    $scope.$watch('postVm.notebook.media.audio', function(oldValue, newValue) {
        if (oldValue) {
            postVm.audioPath = oldValue.path || window.URL.createObjectURL(oldValue);
        }
    });
    $scope.$watch('postVm.notebook.media.image', function(oldValue, newValue) {
        if (oldValue) {
            postVm.imagePath = oldValue.path || window.URL.createObjectURL(oldValue);
        }
    });

}
