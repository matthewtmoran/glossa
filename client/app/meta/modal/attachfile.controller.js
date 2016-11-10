'use strict';

angular.module('glossa')
    .controller('attachfileCtrl', attachfileCtrl);

function attachfileCtrl($mdDialog, currentFile, fileSrvc) {
    var atVm = this;

    atVm.currentFile = currentFile;
    atVm.searchText = '';
    atVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];


    /*
    *
    * {
     name: String,
     description: String,
     image: {
     name: String,
     path: String,
     description: String,
     },
     audio: {
     name: String,
     path: String,
     description: String,
     },
     createdBy: String,
     createdAt: Date,
     isAttached: Boolean,
     attachedToId: String
     }
    *
    * */
    atVm.notebooks = [
        {
            name: 'NoteBookName',
            description: 'The is a description that describes the notebook or something',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        },
        {
            name: 'Another Notebook',
            description: 'another descrioption that describes the notebook',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        },
        {
            name: 'A hardcoded notbook',
            description: 'a harcoded description',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        },
        {
            name: 'Best Notebook',
            description: 'best description',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        },
        {
            name: 'Notebook5',
            description: 'Notebook5 description',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        },
        {
            name: 'Notebook6',
            description: 'Notebook6 description',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        },
        {
            name: 'Notebook7',
            description: 'Notebook7 description',
            image: null,
            audio: null,
            createdBy: 'MattMoran',
            createdAt: Date.now(),
            isAttached: false,
            attachedToId: null
        }
    ];
    atVm.notebooksFiltered = [];

    atVm.cancel = cancel;
    atVm.hide = hide;
    atVm.save = save;

    function attachNotebook(notebook) {
        fileSrvc.attachNotebook(notebook, currentFile);
    }

    function cancel() {

        var changedTypes = fileSrvc.getStagedUpdate();
        changedTypes.forEach(function(type) {
            fileSrvc.deleteMediaFile(atVm.currentFile.media[type], type, atVm.currentFile)
        });
        $mdDialog.cancel();
    }

    function hide() {
        $mdDialog.hide();
    }
    function save(answer) {
        fileSrvc.clearStaged();
        $mdDialog.hide(answer);
    }
}