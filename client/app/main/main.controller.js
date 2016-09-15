'use strict';

angular.module('glossa')
    .controller('MainCtrl', MainCtrl);

function MainCtrl($scope) {
    var vm = this;

    vm.select = {
        value: "Option1",
        choices: ["Option1", "I'm an option", "This is materialize", "No, this is Patrick."]
    };

    // vm.uploadFiles = function(files) {
    //     console.log("files", files);
    //     if (files && files.length) {
    //         for (var i = 0; i < files.length; i++) {
    //             Upload.upload({
    //                 url: './uploads',
    //                 arrayKey: '',
    //                 data: {
    //                     file: files[i]
    //                 }
    //             })
    //             .then(function(result) {
    //                 console.log('result', result);
    //             }, function (result) {
    //                 if (result.status > 0) {
    //                     $scope.errorMsg = result.status + ': ' + result.data;
    //                 }
    //             }, function (evt) {
    //                 //this is supposed to show the progress
    //                 $scope.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
    //             });
    //         }
    //     }
    // }

}