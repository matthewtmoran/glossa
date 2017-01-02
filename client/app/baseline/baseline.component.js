'use strict';

var path = require('path'),
    remote = require('electron').remote,
    globalPaths = remote.getGlobal('userPaths');

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
        getAudioImagePath();
        getTextContent(blVm.currentFile);
    }

    function getTextContent(file) {
        baselineSrvc.readContent(file, function(result) {
            blVm.textContent = result;
            $scope.$apply();
        });
    }

    function getAudioImagePath() {
        if (blVm.currentFile.media.audio) {
            blVm.audioPath = path.join(globalPaths.static.trueRoot, blVm.currentFile.media.audio.path)
        }
        if (blVm.currentFile.media.image) {
            blVm.imagePath = path.join(globalPaths.static.trueRoot, blVm.currentFile.media.image.path)
        }
    }

    blVm.update = update;

    function update() {
        baselineSrvc.updateContent(blVm.currentFile, blVm.textContent);
    }
}

