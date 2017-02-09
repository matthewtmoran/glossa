'use strict';
//notebooks details controller should display details of notebooks and should be able to be editable/noneditable
//I would like to use a component but angular material does not currently support components with dialogs

angular.module('glossa')
    .controller('notebookDetailsCtrl', notebookDetailsCtrl);

function notebookDetailsCtrl(dialogSrvc, simplemdeOptions, $scope, NotebookService, $sce, notebook) {
    var dialogVm = this;

    //An object to be returned when dialog closes
    var dialogObject = {
        dataChanged: false,
        event: 'hide',
        data: null
    };

    dialogVm.isNewPost = false;
    dialogVm.editorOptions = simplemdeOptions;
    dialogVm.removedMedia = [];
    dialogVm.cancel = cancel;
    dialogVm.hide = hide;
    dialogVm.save = save;
    dialogVm.removeMedia = removeMedia;
    dialogVm.closeDetails = closeDetails;

    init(); //init the controller function.... TODO: should be changed to componene $onInit once compatible
    function init() {
        findDetailType();
        setDynamicItems();
    }

    function cancel(ev, notebook) {
        restoreMedia()
        dialogSrvc.cancel(dialogObject);
    }

    function hide() {
        dialogSrvc.hide(dialogObject);
    }

    function save() {

        console.log('dialogVm.notebook', dialogVm.notebook);

        dialogObject = {
            dataChanged: true,
            event: 'save',
            data: {}
        };

        return NotebookService.createNotebook(dialogVm.notebook)
            .then(function(result) {
                dialogObject.data = result;
                dialogSrvc.hide(dialogObject);
            });
    }

    function update() {
        //checked for removed media items becuase we want to send them to the server to remove them
        if (dialogVm.removedMedia.length > 0) {
            dialogVm.notebook.removeItem = dialogVm.removedMedia;
        }

        return NotebookService.updateNotebook(dialogVm.notebook).then(function(data) {
            dialogObject = {
                dataChanged: true,
                event: 'update',
                data: {}
            };
            dialogObject.data = data;
            dialogSrvc.hide(dialogObject)
        });
    }

    //precludes setDynamicItems
    function findDetailType() {
        if (!dialogVm.notebook._id) {
            dialogVm.isNewPost = true;
        }
    }
    //function to set at least some dynamic features... TODO: should be moved to service....
    function setDynamicItems() {
        // if (dialogVm.viewOnly) {
        //     dialogVm.previewText = $sce.trustAsHtml(SimpleMDE.markdown(dialogVm.notebooks.description));
        // }
        if (dialogVm.isNewPost) {
            dialogVm.postDetails = {
                title: 'Create New Post',
                button: {
                    action: save,
                    text: 'Save Post'
                }
            }
        } else {
            dialogVm.postDetails = {
                title: dialogVm.notebook.name + ' Details',
                button: {
                    action: update,
                    text: 'Update Post'
                }
            }
        }
    }
    //called if media is 'removed' saved tp separate object to send with request to server
    function removeMedia(media) {
        if (media.createdAt) { //this tells us the media has been saved to the db before
            dialogVm.removedMedia.push(media);
        }
    }
    //this is called on cancel and run if media was 'removed' but not saved...
    function restoreMedia() {
        if (dialogVm.removedMedia) {
            //replace the media if it was removed then details were canceled.
            dialogVm.removedMedia.forEach(function(media) {
                if (media.mimetype.indexOf('audio') > -1) { //check if mimetype is an audio type...
                    dialogVm.notebook.audio = media;
                } else {
                    dialogVm.notebook.image = media;
                }
            })
        }
    }

    function closeDetails() {
        dialogSrvc.cancel();
    }

    //keep watch on this just in case a file is uploaded or if file is already in server...
    $scope.$watch('dialogVm.notebook.audio', function(oldValue, newValue) {
        if (oldValue) {
            dialogVm.audioPath = oldValue.path || window.URL.createObjectURL(oldValue);
        }
    });
    $scope.$watch('dialogVm.notebook.image', function(oldValue, newValue) {
        if (oldValue) {
            dialogVm.imagePath = oldValue.path || window.URL.createObjectURL(oldValue);
        }
    });

}
