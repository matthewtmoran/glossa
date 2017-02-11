'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('settings.media', {
            url: '/media',
            template: '<media-settings-component settings="vm.settings" flex layout="column">',
            parent: 'settings'
        });
}