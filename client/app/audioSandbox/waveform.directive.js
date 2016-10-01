angular.module('glossa')
    .directive('mdWavesurferAudio', mdWavesurferAudio);


function mdWavesurferAudio () {
    return {
        restrict: 'E',
        templateUrl: 'md-player-audio.partial.html',
        transclude: true,
        controller: 'mdWavesurferAudioController',
        controllerAs: 'audio'
    };
}