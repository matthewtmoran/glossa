'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('help', {
            url: '/help',
            template: '<help-component flex layout="column">',
        });
}