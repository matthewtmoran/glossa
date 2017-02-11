'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('hashtags', {
            url: '/hashtags',
            template: '<hashtags-component flex layout="column">'
        });
}