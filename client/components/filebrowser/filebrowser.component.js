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

function filebrowserComponent(fileSrvc, $scope, baselineSrvc, $stateParams, markdownSrvc) {
    var fbVm = this;

    fbVm.fileSelection = fileSelection;
    fbVm.createMDFile = createMDFile;
    fbVm.fileList = [];
    var currentCorpus;

    fbVm.$onInit = function() {
        currentCorpus = $stateParams.corpus;
        getFiles(currentCorpus);
    };

    function getFiles(corpus) {
        markdownSrvc.getFiles(corpus).then(function(data) {
            data.forEach(function(file) {
                fbVm.fileList.push(file)
            });
            fbVm.currentFile = fbVm.fileList[0];
        })
    }



    /**
     * Queries for all files in db.
     * Returns a promise object
     */
    // function initialFileList(corpus) {
    //     var prevLength = 37;
    //     fileSrvc.queryAllFiles(corpus).then(function(docs) {
    //
    //         docs.data.forEach(function(doc){
    //             baselineSrvc.readContent(doc, function(content) {
    //                 if (content.length > prevLength) {
    //                     doc.previewContent = content.substring(0, prevLength) + '...';
    //                 } else {
    //                     doc.previewContent = content;
    //                 }
    //             });
    //             fbVm.fileList.push(doc);
    //
    //         });
    //
    //         //set intitial file
    //         updateFileSelection(fbVm.fileList[0]);
    //     });
    // }

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
        console.log('updateFileSelection');
        // fileSrvc.setCurrentFile(file);
        // fbVm.currentFile = fileSrvc.getCurrentFile();
        fbVm.currentFile = file;
    }

    /**
     * Creates a new blank texts(.md) document
     */
    function createMDFile() {
        console.log('createMDFile');
        var newFile = {
            corpus: $stateParams.corpus,
            createdBy: 'Moran'
        };
        markdownSrvc.createFile(newFile).then(function(data) {
            console.log('data', data);
            fbVm.fileList.push(data);
            fbVm.currentFile = data;
        });
    }

    /**
     * Event Listener for #uploadButton click event
     * Broadcasted from main.component.js
     */
    $scope.$on('create:textFile', function() {
        createMDFile();
    });

    /**
     * Event Listener for deleteText file
     *
     * Broadcasted from main.component.js -> emitted from meta.component.js
     * event - default event data
     * data - currentFile
     *
     * Removes file from view and updates currentFile
     *
     */
    $scope.$on('rm:textFile', function(event, data) {
        var index = fbVm.fileList.indexOf(data);
        fbVm.fileList.splice(index, 1);
        updateFileSelection(fbVm.fileList[0]);
    })

}