'use strict';

angular.module('glossa')
    .controller('MainCtrl', MainCtrl);

function MainCtrl($scope, nodeSrvc, fileSrvc) {
    var vm = this;

    vm.selectedFile = {};
    vm.fileList = [];
    vm.aceContent = "";
    vm.searchText = 'test';
    vm.filteredFiles = [];
    // vm.filteredFiles = fileSrvc.data.filteredFiles;

    vm.createNewTextFile = createNewTextFile;
    // vm.fileClicked = fileClicked;
    vm.fileSelection = fileSelection;
    vm.searchSubmit = searchSubmit;
    vm.uploadFiles = uploadFiles;
    vm.updateData = updateData;

    activate();

    function activate() {
        buildFileList();
    }

    // /**
    //  * Creates a new blank texts(.md) document
    //  */
    // function createNewTextFile() {
    //     fileSrvc.createNewTextFile().then(function(file) {
    //         updateFileSelection(file);
    //     });
    // }

    // function fileClicked(file) {
    //     console.log(' file ', file);
    //     vm.selectedFile = file;
    //     vm.aceContent = nodeSrvc.getFileContent(file.path);
    // }

    function fileSelection(file) {
        updateFileSelection(file);
        if (vm.selectedFile.category === 'audio') {
            initWave(vm.selectedFile);
        }
    }

    /**
     * Called when search is submitted.
     */
    function searchSubmit() {
        //if there is not text just return
        if (!vm.searchText) {
            return;
        }
        //if there is text and there is no results in the filtered list
        if (vm.searchText.length && !vm.filteredFiles.length) {
        //    create a new file with the search term
        fileSrvc.createNewTextFile(vm.searchText).then(function(file) {
                vm.selectedFile = file;
                vm.searchText = '';
            });
        }
    }

    /**
     * Uploads the file
     * Saves data in db
     * pushes file to fileList array
     * @param files - the files selected
     */
    function uploadFiles(files) {
        files.forEach(function(file) {
            fileSrvc.uploadFile(file).filter(function(f) {
                if (vm.fileList.indexOf(f) < 0) {
                    vm.fileList.push(f);
                }
            });
        });
    }



    //helper functions//

    /**
     * Queries for all files in db.
     * Returns a promise object
     */
    function buildFileList() {
        // fileSrvc.queryAllFiles().then(function(docs) {
        //     vm.fileList = docs;
        //     //set intitial file
        //     updateFileSelection(vm.fileList[0]);
        // });

        // fileSrvc.queryAllFiles();

        // console.log('fileSrvc.fileList', fileSrvc.fileList);

        // vm.fileList = fileSrvc.data.fileList;

        // updateFileSelection(vm.fileList[0]);
    }

    /**
     * Sets the current file
     * @param file
     */
    function updateFileSelection(file) {
        fileSrvc.setCurrentFile(file);
        vm.selectedFile = fileSrvc.getCurrentFile();
    }

}