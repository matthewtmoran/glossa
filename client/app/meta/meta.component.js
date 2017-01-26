'use strict';

// var remote = require('electron').remote,
//     path = require('path'),
//     globalPaths = remote.getGlobal('userPaths');

angular.module('glossa')
    .component('metaComponent', {
        controller: metaCtrl,
        controllerAs: 'metaVm',
        templateUrl: 'app/meta/meta.html',
        transclude: true,
        bindings: {
            currentFile: '=',
            notebookAttachment: '=',
            markdownFiles: '='
        },
        require: {
            corpus: '^^corpusComponent'
        }
    });

function metaCtrl($scope, notebookSrvc, $timeout, postSrvc, dialogSrvc, markdownSrvc) {
    var metaVm = this;


    metaVm.isOpen = false;
    metaVm.items = [
        { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];
    metaVm.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        forceSync: true,
        placeholder: 'Description...',
        updateFunction: update
    }; //main description editor option
    metaVm.cardOptions = {
        disAction: disconnectNotebook
    }; //notebook cared options (disconnect button)

    metaVm.update = update;
    metaVm.disconnectNotebook = disconnectNotebook;
    metaVm.addAttachment = addAttachment;
    metaVm.deleteMarkdownFile = deleteMarkdownFile;
    metaVm.removeMedia = removeMedia;
    metaVm.viewDetails = viewDetails;

    $scope.$watch('metaVm.isOpen', isOpenWatch);
    $scope.$watch('metaVm.currentFile', watchCurrentFile);

    //update transcription file
    //Cant pass in file here right now.  simplemde binding is 'static'.. need to find a way to make the binding dynamic or just reference metaVm.currentFile
    function update(field) {

        markdownSrvc.updateFile(metaVm.currentFile).then(function(data) {

            metaVm.currentFile = data;

            metaVm.markdownFiles.forEach(function(file, index) {
                if (file._id === data._id) {
                    metaVm.markdownFiles[index] = data;
                }
            })
        });
    }

    //disconnects notebook from file
    function disconnectNotebook(notebook) {
        var options = {
            title: 'Are you sure you want to disconnect this notebook?',
            textContent: 'By clicking yes, you will disconnect the Notebook and it\'s associated media from this file.'
        };
        dialogSrvc.confirmDialog(options).then(function(result) {
            console.log('result', result);
            if (!result) {
                return;
            }
            delete metaVm.currentFile.attachment;
            markdownSrvc.updateFile(metaVm.currentFile)
                .then(function(data) {
                    metaVm.currentFile = data;
                });
        })
    }

    /**
     * This function opens the attach dialog.
     * @param ev - this is the event object
     * The result will be returned whether an item is attached or not.
     */
    function addAttachment(ev) {
        dialogSrvc.mediaAttachment(ev, metaVm.currentFile).then(function(result) {
            metaVm.currentFile = result;
            metaVm.markdownFiles.forEach(function(file, index) {
                if (file._id === result._id) {
                    metaVm.markdownFiles[index] = result;
                }
            })
        });
    }

    //delete the markdown file
    function deleteMarkdownFile(ev, file) {
        var options = {
            title: 'Are you sure you want to delete this markdown file?',
            textContent: 'By clicking yes, you confirm to delete all independently attached media files associated with this file?',
            okBtn: 'Yes, Delete',
            cancelBtn: 'No, cancel'
        };

        dialogSrvc.confirmDialog(options)
            .then(function okayCallback(response) {
                if (!response) {
                    return console.log('confirm cancel response', response);
                }
                return markdownSrvc.removeFile(file).then(function(data) {
                    metaVm.corpus.deletMDFile(file);
                    return data;
                })

            });
    };

    //remove independent media
    function removeMedia(ev, media, type) {
        var options = {
            title: 'Are you sure you want to disconnect this media attachment?',
            textContent: 'By clicking yes you will remove this media attachment from the application',
        };
        dialogSrvc.confirmDialog(options).then(function(result) {
            if (!result) {
                return;
            }
            metaVm.currentFile.removeItem = []; //create this temp property to send to server
            metaVm.currentFile.removeItem.push(metaVm.currentFile.media[type]);
            delete metaVm.currentFile.media[type]; //delete this property...
            markdownSrvc.updateFile(metaVm.currentFile)
                .then(function(data) {
                    //reset currentFile
                    metaVm.currentFile = data;
                    //reset file in list
                    metaVm.markdownFiles.forEach(function(file, index) {
                        if (file._id === data._id) {
                            metaVm.markdownFiles[index] = data;
                        }
                    })

                });
        })
    }

    //view notebook details... should be view only
    function viewDetails(ev, notebook) {
        var postOptions = postSrvc.postOptions(ev, notebook);
        dialogSrvc.viewDetails(ev, postOptions, notebook);
    }


    ///////////
    //Helpers//
    ///////////


    //Queryies the attached notebook data
    function queryAttachedNotebook(nbId) {
        notebookSrvc.findNotebook(nbId).then(function(data) {
           metaVm.attachedNotebook = data;
        });
    }


    ////////////
    //watchers//
    ////////////


    //has to do with drawer...
    function isOpenWatch(isOpen) {
        if (isOpen) {
            $timeout(function() {
                $scope.tooltipVisible = metaVm.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = metaVm.isOpen;
        }
    }

    //watch current file for update to notebook attachment
    function watchCurrentFile(currentFile, oldFile) {
        if(currentFile && currentFile.notebookId) {
            queryAttachedNotebook(currentFile.notebookId);
        }
    }


}