'use strict';
angular.module('glossa')
    .directive('wavesurferPlayer', WavesurferPlayer);

function WavesurferPlayer() {

    return {
        restrict: 'E',
        templateUrl: 'components/wavesurfer/wavesurfer-player/wavesurfer-player.html',
        scope: {
            src: '@url',
            title: '@',
            extraButtons: '=',
            toolbarClass: '@',
            autoPlay: '=',
            properties: '='
        },
        transclude: true,
        controller: 'wavesurferPlayerController',
        controllerAs: 'control',
        bindToController: true
    };
};