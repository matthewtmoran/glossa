'use strict';
angular.module('glossa')
    .directive('mdWavesurferPlayer', mdWavesurferPlayer);

function mdWavesurferPlayer() {

    return {
        restrict: 'E',
        templateUrl: 'components/wavesurferDirectives/mdWavesurferPlayer/mdWavesurferPlayer.html',
        scope: {
            src: '@url',
            title: '@',
            extraButtons: '=',
            toolbarClass: '@',
            autoPlay: '=',
            properties: '=',
        },
        transclude: true,
        controller: 'mdWavesurferPlayerController',
        controllerAs: 'control',
        bindToController: true
    };
};