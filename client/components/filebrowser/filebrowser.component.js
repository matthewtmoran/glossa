'use strict';

angular.module('glossa')
    .component('filebrowserComponent', {
        controller: filebrowserComponent,
        controllerAs: 'fbVm',
        templateUrl: 'components/filebrowser/filebrowser.html',
        // transclude: true,
        // require: {
        //     main: '^mainComponent'
        // },
    });

function filebrowserComponent(fileSrvc, $scope) {
    var fbVm = this;
    // fbVm.fileList = [];
    // // fbVm.filteredFiles = [];
    // fbVm.searchText = '';

    // fbVm.$onInit = function () {
    //     fbVm.searchText = fbVm.main.searchText;
    // };

    // $scope.$watch('fbVm.main.searchText', function(val) {
    //     fbVm.searchText = val;
    // });

    // fileSrvc.queryAllFiles().then(function(docs) {
    //     fbVm.fileList = docs;
    //
    // });




}