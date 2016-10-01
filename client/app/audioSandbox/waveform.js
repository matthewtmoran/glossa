'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('waveform', {
            url: '/waveform',
            templateUrl: 'app/audioSandbox/waveform.html',
            controller: 'Waveform',
            controllerAs: 'waveVm'
        });
}