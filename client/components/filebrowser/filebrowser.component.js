'use strict';

angular.module('glossa')
    .component('filebrowserComponent', {
        controller: filebrowserComponent,
        controllerAs: 'fbVm',
        templateUrl: 'components/filebrowser/filebrowser.html',
        transclude: true,
        bindings: {
            searchText: '=',
            currentFile: '='
        }
    });

function filebrowserComponent(fileSrvc, $scope) {
    var fbVm = this;

    fbVm.fileSelection = fileSelection;
    fbVm.createNewTextFile = createNewTextFile;


    fbVm.fileList = [];


    //Listener for fab button click
    $scope.$on('create:textFile', function() {
        createNewTextFile();
    });

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

    /**
     * Creates a new blank texts(.md) document
     */
    function createNewTextFile() {
        fileSrvc.createNewTextFile().then(function(file) {
            fbVm.fileList.push(file);
            updateFileSelection(file);
        });
    }

    function updateData(data) {
        var changeData = {
            fileId: data.fileId,
            options: {},
            newObj: {},
            field: data.field,
            file: vm.selectedFile
        };

        changeData['newObj'][data.field] = vm.selectedFile[data.field];

        fileSrvc.updateFileData(changeData);
    }

}