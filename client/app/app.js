'use strict';

angular.module('glossa', [
    'ngMaterial',
    'ui.router',
    'ui.ace'
    ])
    .config(config);

function config($stateProvider, $urlRouterProvider, $mdIconProvider, $mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('pink');
    $urlRouterProvider
        .otherwise('/');
    $mdIconProvider
        .defaultIconSet('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.svg', 24);
};