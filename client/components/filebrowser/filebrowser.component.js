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

function filebrowserComponent(fileSrvc, $scope, baselineSrvc, $stateParams) {
    var fbVm = this;

    fbVm.fileSelection = fileSelection;
    fbVm.createNewTextFile = createNewTextFile;
    fbVm.fileList = [];
    var currentCorpus = $stateParams.corpus;

    activate();

    function activate() {
        initialFileList(currentCorpus);
    }

    /**
     * Queries for all files in db.
     * Returns a promise object
     */
    function initialFileList(corpus) {
        var prevLength = 37;
        fileSrvc.queryAllFiles(corpus).then(function(docs) {

            docs.data.forEach(function(doc){
                baselineSrvc.readContent(doc, function(content) {
                    if (content.length > prevLength) {
                        doc.previewContent = content.substring(0, prevLength) + '...';
                    } else {
                        doc.previewContent = content;
                    }
                });
                fbVm.fileList.push(doc);

            });

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
        fileSrvc.createNewTextFile().then(function(result) {
            fbVm.fileList.push(result.data);
            updateFileSelection(result.data);
        });
    }

    /**
     * Event Listener for #uploadButton click event
     * Broadcasted from main.component.js
     */
    $scope.$on('create:textFile', function() {
        createNewTextFile();
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