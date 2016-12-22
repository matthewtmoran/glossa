'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('notebook', {
            url: '/notebook',
            template: '<notebook-component flex layout="column">'
        });
}