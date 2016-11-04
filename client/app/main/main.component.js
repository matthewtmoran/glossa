'use strict';

angular.module('glossa')
    .component('mainComponent', {
        controller: MainCtrl,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/main/main.html'
    });

function MainCtrl($scope, nodeSrvc, fileSrvc) {
    var vm = this;

    vm.createNewTextFile = createNewTextFile;
    $scope.$on('remove:textFile', removeTextFile);


    /**
     * Creates a new blank text document
     *
     * Event is 'sent' down the scope
     *
     * Listener is located in filebrowser.component.js
     */
    function createNewTextFile() {
        $scope.$broadcast('create:textFile');
    }
    /**
     * Event listener for deleteText
     *
     * Emitted from meta.component.js and $broadcasts down to filebrowser.component.js
     *
     * event - default event data
     * data - currentFile
     *
     */
    function removeTextFile(event, data) {
        $scope.$broadcast('rm:textFile', data);
    }


    // function fileSelection(file) {
    //     updateFileSelection(file);
    //     if (vm.selectedFile.category === 'audio') {
    //         initWave(vm.selectedFile);
    //     }
    // }
    //
    // //TODO: confirm deletion
    // /**
    //  * Called when search is submitted.
    //  */
    // function searchSubmit() {
    //     //if there is not text just return
    //     if (!vm.searchText) {
    //         return;
    //     }
    //     //if there is text and there is no results in the filtered list
    //     if (vm.searchText.length && !vm.filteredFiles.length) {
    //         //    create a new file with the search term
    //         fileSrvc.createNewTextFile(vm.searchText).then(function(file) {
    //             vm.selectedFile = file;
    //             vm.searchText = '';
    //         });
    //     }
    // }
    //
    // //TODO: confirm deletion
    // /**
    //  * Uploads the file
    //  * Saves data in db
    //  * pushes file to fileList array
    //  * @param files - the files selected
    //  */
    // function uploadFiles(files) {
    //     files.forEach(function(file) {
    //         fileSrvc.uploadFile(file).filter(function(f) {
    //             if (vm.fileList.indexOf(f) < 0) {
    //                 vm.fileList.push(f);
    //             }
    //         });
    //     });
    // }
    //
    // //TODO: confirm deletion
    // function updateData(data) {
    //     var changeData = {
    //         fileId: data.fileId,
    //         options: {},
    //         newObj: {},
    //         field: data.field,
    //         file: vm.selectedFile
    //     };
    //
    //     changeData['newObj'][data.field] = vm.selectedFile[data.field];
    //
    //     fileSrvc.updateFileData(changeData);
    // }
    //
    // //helper functions//
    //
    // //TODO: confirm deletion
    // /**
    //  * Queries for all files in db.
    //  * Returns a promise object
    //  */
    // function buildFileList() {
    //     fileSrvc.queryAllFiles().then(function(docs) {
    //
    //         vm.fileList = docs;
    //         //set intitial file
    //         updateFileSelection(vm.fileList[0]);
    //     });
    //
    //     // fileSrvc.queryAllFiles();
    //
    //     // console.log('fileSrvc.fileList', fileSrvc.fileList);
    //
    //     // vm.fileList = fileSrvc.data.fileList;
    //
    //     // updateFileSelection(vm.fileList[0]);
    // }
    //
    // //TODO: confirm deletion
    // /**
    //  * Sets the current file
    //  * @param file
    //  */
    // function updateFileSelection(file) {
    //     fileSrvc.setCurrentFile(file);
    //     vm.selectedFile = fileSrvc.getCurrentFile();
    // }

}