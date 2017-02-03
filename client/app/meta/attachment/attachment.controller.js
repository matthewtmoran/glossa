'use strict';

angular.module('glossa')
    .controller('attachmentCtrl', attachmentCtrl);

function attachmentCtrl(dialogSrvc, currentFile, markdownSrvc, notebookSrvc, $scope, $q) {
    var atVm = this;

    //make copy to make changes on... so we can restore changes on cancel
    atVm.currentFileEditable = angular.copy(atVm.currentFile);
    atVm.searchText = '';
    atVm.notebooksFiltered = [];
    atVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    atVm.cancel = cancel;
    atVm.hide = hide;
    atVm.save = save;
    atVm.attachNotebook = attachNotebook;
    atVm.showNotebookPreview = showNotebookPreview;

    //keeps the audio path up to date depeneidng if it is a file or object with path
    $scope.$watch('atVm.currentFileEditable.audio', audioWatcher);
    //keeps the image path up to date depeneidng if it is a file or object with path
    $scope.$watch('atVm.currentFileEditable.image', imageWatcher);


    init();
    //psuedo inti function
    function init() {
        notebookSrvc.getNotebooks().then(function(data) {
            atVm.notebooks = data;
        })
    }

    function cancel() {
        dialogSrvc.cancel(currentFile);
    }
    function hide() {
        dialogSrvc.hide('hide');
    }
    
    function save() {
        //if a notebooks is selected attach to currentFileEditable
        
        if(atVm.notebookSelected) {
            attachNotebook(atVm.notebookSelected)
        }

        markdownSrvc.updateFile(atVm.currentFileEditable).then(function(data) {
            dialogSrvc.hide(data);
        });
    }

    //attaches notebooks to file
    function attachNotebook(notebook, currentFile) {
        //this just attaches data to the file object... I promisefy it here.
        $q.when(markdownSrvc.attachNotebook(atVm.currentFileEditable, notebook))
            .then(function(response) {
                atVm.currentFileEditable = response.file;
            });
    }

    //called when notebooks is selected
    function showNotebookPreview(notebook) {
        console.log('showNotebookPreview');
        atVm.notebookSelected = notebook;
    }


    ////////////
    //Watchers//
    ////////////


    //keeps the audio path up to date depeneidng if it is a file or object with path
    function audioWatcher(newValue) {
        if (newValue) {
            atVm.audioPath = newValue.path || window.URL.createObjectURL(newValue);
        }
    }

    //keeps the image path up to date depeneidng if it is a file or object with path
    function imageWatcher(newValue) {
        if (newValue) {
            atVm.imagePath = newValue.path || window.URL.createObjectURL(newValue);
        }
    }

}