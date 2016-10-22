'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main.meta', {
            url: '/meta',
            templateUrl: 'app/meta/meta.html',
            controller: 'metaCrtl',
            controllerAs: 'metaVm'
        });
}