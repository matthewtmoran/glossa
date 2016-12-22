'use strict';
angular.module('glossa')
    .directive('wavePreview', wavePreview);

function wavePreview() {

    return {
        restrict: 'E',
        templateUrl: 'components/wavesurferDirectives/wavePreview/wavePreview.html',
        scope: {
            src: '@url',
            title: '@',
            extraButtons: '=',
            toolbarClass: '@',
            autoPlay: '=',
            properties: '='
        },
        controller: 'mdWavesurferPlayerController',
        controllerAs: 'control',
        bindToController: true
    };
};