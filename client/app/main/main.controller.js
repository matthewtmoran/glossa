'use strict';

angular.module('glossa')
    .controller('MainCtrl', MainCtrl);

function MainCtrl($scope, nodeSrvc, fileSrvc) {
    var vm = this;

    vm.selectedFile = {};
    vm.fileList = [];
    vm.aceContent = "";
    vm.searchText = '';
    vm.filteredFiles = [];

    vm.createNewText = createNewText;
    vm.fileClicked = fileClicked;
    vm.fileSelection = fileSelection;
    vm.searchSubmit = searchSubmit;
    vm.uploadFiles = uploadFiles;

    activate();

    function activate() {
        buildFileList();
    }

    /**
     * Creates a new blank texts(.md) document
     */
    function createNewText() {
        fileSrvc.createNewText().then(function(file) {
            vm.selectedFile = file;
        });
    }

    function fileClicked(file) {
        console.log(' file ', file);
        vm.selectedFile = file;
        vm.aceContent = nodeSrvc.getFileContent(file.path);
    }

    function fileSelection(file) {
        vm.selectedFile = file;
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
        fileSrvc.createNewText(vm.searchText).then(function(file) {
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
        fileSrvc.getAllFiles().then(function(docs) {
            vm.fileList = docs;
        });
    }












    function initWave(file) {

    }




}