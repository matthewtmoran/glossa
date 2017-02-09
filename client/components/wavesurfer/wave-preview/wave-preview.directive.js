'use strict';
angular.module('glossa')
    .directive('wavePreview', WavePreview);

function WavePreview() {

    return {
        restrict: 'E',
        templateUrl: 'components/wavesurfer/wave-preview/wave-preview.html',
        scope: {
            src: '@url',
            title: '@',
            extraButtons: '=',
            toolbarClass: '@',
            autoPlay: '=',
            properties: '='
        },
        controller: 'wavesurferPlayerController',
        controllerAs: 'control',
        bindToController: true
    };
};