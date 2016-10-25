'use strict';

angular.module('glossa')
    .controller('filebrowserCrtl', filebrowserCrtl);

function filebrowserCrtl(fileSrvc) {
    var fbVm = this;

    fbVm.fileSelection = fileSelection;

    fbVm.fileList = [];


    fileSrvc.queryAllFiles().then(function(docs) {
        fbVm.fileList = docs;
        //set intitial file
        updateFileSelection(fbVm.fileList[0]);
    });

    function fileSelection(file) {
        updateFileSelection(file);
        // if (vm.selectedFile.category === 'audio') {
        //     initWave(vm.selectedFile);
        // }
    }

    /**
     * Sets the current file
     * @param file
     */
    function updateFileSelection(file) {
        fileSrvc.setCurrentFile(file);
        fbVm.currentFile = fileSrvc.getCurrentFile();
    }

}

