'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('settings.project', {
            url: '/project',
            template: '<project-settings-component flex layout="column">',
            parent: 'settings'
        });
}