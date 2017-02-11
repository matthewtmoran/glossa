'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('settings.about', {
            url: '/about',
            template: '<about-settings-component flex layout="column">',
            parent: 'settings'
        });
}