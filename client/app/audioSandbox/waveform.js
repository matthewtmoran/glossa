'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('wavesurfer', {
            url: '/wavesurfer',
            templateUrl: 'app/audioSandbox/waveform.html',
            controller: 'Wavesurfer',
            controllerAs: 'waveVm'
        });
}