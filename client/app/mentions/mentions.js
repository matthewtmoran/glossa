'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('mentions', {
            url: '/mentions',
            templateUrl: 'app/mentions/mentions.html',
            controller: 'mentionsCtrl',
            controllerAs: 'mentionsVm'
        });
}