'use strict';

// var db = require('../db/database'),
//     guitars = db.guitars;

angular.module('glossa')
    .controller('MainCtrl', MainCtrl);

function MainCtrl($scope, nodeSrvc, fileSrvc) {
    var vm = this;

    vm.selectedFile = {};
    vm.fileList = [];
    vm.aceContent = "";

    vm.uploadFiles = uploadFiles;
    vm.fileClicked = fileClicked;
    vm.fileSelection = fileSelection;

    activate();

    function activate() {
        buildFileList();
    }

    /**
     * Queries for all files in db.
     * Returns a promise object
     */
    function buildFileList() {
        fileSrvc.getAllFiles().then(function(docs) {
            vm.fileList = docs;
        });
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

    function initWave(file) {

    }




}