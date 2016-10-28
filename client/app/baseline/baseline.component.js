'use strict';

angular.module('glossa')
    .component('baselineComponent', {
        controller: baselineCtrl,
        controllerAs: 'blVm',
        templateUrl: 'app/baseline/baseline.html',
        transclude: true,
        bindings: {
            currentFile: '='
        },
        require: {
            parent: '^^viewerEditorComponent'
        }
    });

function baselineCtrl($scope, fileSrvc, $mdDialog) {
    var blVm = this;


    console.log('blVm.currentFile',blVm.currentFile);
}