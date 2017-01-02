'use strict';

var path = require('path'),
    remote = require('electron').remote,
    globalPaths = remote.getGlobal('userPaths');

angular.module('glossa')
    .controller('attachfileCtrl', attachfileCtrl);

function attachfileCtrl($mdDialog, currentFile, fileSrvc, notebookSrvc) {
    var atVm = this;

    atVm.currentFile = currentFile;

    atVm.currentFileEditable = angular.copy(atVm.currentFile);
    atVm.searchText = '';
    atVm.notebooksFiltered = [];
    atVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    notebookSrvc.query().then(function(docs) {
        docs.data.forEach(function(nb) {
            if (nb.media.image) {
                nb.imagePath = path.join(globalPaths.static.trueRoot, nb.media.image.path);
            }
        });
        atVm.notebooks = docs.data;
    });

    atVm.cancel = cancel;
    atVm.hide = hide;
    atVm.save = save;
    atVm.attachNotebook = attachNotebook;

    function attachNotebook(notebook, currentFile) {

        atVm.activeNotebook = notebook;

        fileSrvc.attachNotebook(notebook, currentFile, function(err, nb, cf) {
            if (err) {return console.log('There was an error ', err);}
            atVm.currentFile = cf;
            atVm.notebook = nb;
        });

    }

    function cancel() {
        //pass back original object to meta view
        $mdDialog.cancel(currentFile);
    }
    function hide() {
        $mdDialog.hide('hide');
    }
    function save() {
        if (atVm.currentFileEditable.mediaType === 'notebook') {
            //TODO: attach notebook
            fileSrvc.saveNotebookAttachment(atVm.currentFileEditable, atVm.notebook, function(err, result) {
                if (err) {return console.log('There was an error attaching notebook:', err)}
                $mdDialog.hide(result);
            })
        } else {
            //TODO: attach files independently
            fileSrvc.saveIndependentAttachment(atVm.currentFileEditable, function(err, result) {
                if (err) {return console.log('There was an error', err);}
                $mdDialog.hide(result);
            });
        }
    }
}