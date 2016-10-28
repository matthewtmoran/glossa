'use strict';

angular.module('glossa')
    .controller('attachfileCtrl', attachfileCtrl);

function attachfileCtrl($mdDialog, currentFile) {
    var atVm = this;

    atVm.currentFile = currentFile;
    atVm.searchText = '';

    atVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];
    atVm.notebooks = [
        {
            name: 'NoteBookName',
            description: 'The is a description that describes the notebook or something'
        },
        {
            name: 'Another Notebook',
            description: 'another descrioption that describes the notebook'
        },
        {
            name: 'A hardcoded notbook',
            description: 'a harcoded description'
        },
        {
            name: 'Best Notebook',
            description: 'best description'
        },
        {
            name: 'Notebook5',
            description: 'Notebook5 description'
        },
        {
            name: 'Notebook6',
            description: 'Notebook6 description'
        },
        {
            name: 'Notebook7',
            description: 'Notebook7 description'
        }
    ];
    atVm.notebooksFiltered = [];


    atVm.hide = function() {
        $mdDialog.hide();
    };

    atVm.cancel = function() {
        $mdDialog.cancel();
    };

    atVm.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}