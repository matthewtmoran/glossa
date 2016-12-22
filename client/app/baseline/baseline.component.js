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

function baselineCtrl($scope, fileSrvc, $mdDialog, baselineSrvc) {
    var blVm = this;

    blVm.textContent = '';

    activate();

    function activate() {
        getTextContent(blVm.currentFile);
    }

    function getTextContent(file) {
        baselineSrvc.readContent(file, function(result) {
            blVm.textContent = result;
            $scope.$apply();
        });
    }

    blVm.update = update;

    function update() {
        baselineSrvc.updateContent(blVm.currentFile, blVm.textContent);
    }
}

