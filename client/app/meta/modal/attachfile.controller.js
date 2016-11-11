'use strict';

angular.module('glossa')
    .controller('attachfileCtrl', attachfileCtrl);

function attachfileCtrl($mdDialog, currentFile, fileSrvc, notebookSrvc) {
    var atVm = this;

    atVm.currentFile = currentFile;
    atVm.currentFileBackup = angular.copy(atVm.currentFile);
    atVm.searchText = '';
    atVm.notebooksFiltered = [];
    atVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    notebookSrvc.queryNotebooks().then(function(docs) {
        atVm.notebooks = docs;
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
        $mdDialog.cancel(atVm.currentFileBackup);
    }
    function hide() {
        $mdDialog.hide();
    }
    function save() {
        console.log('save occurred');
        if (atVm.currentFile.mediaType === 'notebook') {
            console.log('type is notebook');
            //TODO: attach notebook
            fileSrvc.saveNotebookAttachment(atVm.currentFile, atVm.notebook, function(err, result) {
                if (err) {return console.log('There was an error attaching notebook:', err)}
                console.log('Notebook attached successful: ', result);
                $mdDialog.hide(result);
            })

        } else {
            //TODO: attach files independently
            fileSrvc.saveIndependentAttachment(atVm.currentFile, function(err, result) {
                if (err) {return console.log('There was an error', err);}
                console.log('This is the result of the save function and attach function');
                $mdDialog.hide(result);
            });
        }


    }
}