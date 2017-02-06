'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('notebook', {
            url: '/notebooks',
            template: '<notebooks-component flex layout="column">'
        });
}