'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('settings.network', {
            url: '/network',
            template: '<network-settings-component flex layout="column">',
            parent: 'settings'
        });
}