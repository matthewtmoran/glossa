'use strict';

angular.module('glossa')
    .controller('MainCtrl', MainCtrl);

function MainCtrl($scope, nodeSrvc) {
    var vm = this;

    vm.select = {
        value: "Option1",
        choices: ["Option1", "I'm an option", "This is materialize", "No, this is Patrick."]
    };

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

    function buildFileList() {
        vm.fileList = nodeSrvc.getFiles();
    }

    function uploadFiles(files) {
        files.forEach(function(file) {
            nodeSrvc.addFiles(file).filter(function(f) {
                if (vm.fileList.indexOf(f) < 0) {
                    vm.fileList.push(f);
                }
            });
        });
    }

    function fileClicked(file) {
        vm.selectedFile = file;
        vm.aceContent = nodeSrvc.getFileContent(file.filePath);
    }

    function fileSelection(file) {
        vm.selectedFile = file;
    }

    function initWave(file) {

    }




}