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

    activate();

    function activate() {
        initialFileList();
    }

    /**
     * Queries for all files in db.
     * Returns a promise object
     */
    function initialFileList() {
        fileSrvc.queryAllFiles().then(function(docs) {
            fbVm.fileList = docs;
            //set intitial file
            updateFileSelection(fbVm.fileList[0]);
        });
    }

    /**
     * Define the selected file
     * called on file click event
     * @param file
     */
    function fileSelection(file) {
        updateFileSelection(file);
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

    /**
     * Event Listener for #uploadButton click event
     * Broadcasted from main.component.js
     */
    $scope.$on('create:textFile', function() {
        createNewTextFile();
    });

    $scope.$on('rm:textFile', function(event, data) {
        var index = fbVm.fileList.indexOf(data);
        fbVm.fileList.splice(index, 1);
        updateFileSelection(fbVm.fileList[0]);
    })

}