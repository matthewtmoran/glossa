'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'app/main/main.html',
            controller: 'MainCtrl',
            controllerAs: 'vm'
        });
}