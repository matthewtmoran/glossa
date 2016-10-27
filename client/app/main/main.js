'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main', {
            url: '/',
            template: '<main-component flex layout="column">'
        });
}