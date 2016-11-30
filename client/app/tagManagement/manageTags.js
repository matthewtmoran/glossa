'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('managetags', {
            url: '/managetags',
            template: '<manage-tags-component flex layout="column">'
        });
}