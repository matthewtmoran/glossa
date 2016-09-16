'use strict';

angular.module('glossa')
    .controller('MainCtrl', MainCtrl);

function MainCtrl($scope, nodeSrvc) {
    var vm = this;

    vm.select = {
        value: "Option1",
        choices: ["Option1", "I'm an option", "This is materialize", "No, this is Patrick."]
    };

    vm.uploadFiles = uploadFiles;


    function uploadFiles(files) {
        files.forEach(function(file) {
            nodeSrvc.readFile(file);
        })
    }

}