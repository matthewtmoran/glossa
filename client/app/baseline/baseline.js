'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main.baseline', {
            // url: '/meta',
            templateUrl: 'app/baseline/baseline.html',
            controller: 'baselineCrtl',
            controllerAs: 'baselineVm'
        });
}