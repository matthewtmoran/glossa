'use strict';

angular.module('glossa')
    .directive('fileBrowser', fileBrowser);

function fileBrowser() {
    var directive = {
        restrict: 'E',
        templateUrl: 'components/filebrowser/filebrowser.html',
        scope: {
            searchText: '=',
            currentFile: '='
        },
        controller: filebrowserCrtl,
        controllerAs: 'fbVm',
        bindToController: true
    };
    return directive;

    //
    // fileSrvc.queryAllFiles().then(function(docs) {
    //     vm.fileList = docs;
    //     //set intitial file
    //     updateFileSelection(vm.fileList[0]);
    // });



}
