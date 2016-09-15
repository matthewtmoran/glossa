'use strict';

angular.module('glossa', [
    'ngMaterial',
    'ui.router'
    ])
    .config(config);

function config($stateProvider, $urlRouterProvider, $mdIconProvider, $mdThemingProvider) {
    // var customPrimary = {
    //     '50': '#a8bac3',
    //     '100': '#99aeb8',
    //     '200': '#8aa2ae',
    //     '300': '#7a96a3',
    //     '400': '#6b8a99',
    //     '500': '#607d8b',
    //     '600': '#566f7c',
    //     '700': '#4b626d',
    //     '800': '#41545e',
    //     '900': '#36474f',
    //     'A100': '#b7c6cd',
    //     'A200': '#c6d2d8',
    //     'A400': '#d5dee2',
    //     'A700': '#2c3940'
    // };
    // var customAccent = {
    //     '50': '#a60038',
    //     '100': '#bf0041',
    //     '200': '#d9004a',
    //     '300': '#f20053',
    //     '400': '#ff0d5f',
    //     '500': '#ff2670',
    //     '600': '#ff5992',
    //     '700': '#ff73a3',
    //     '800': '#ff8cb3',
    //     '900': '#ffa6c4',
    //     'A100': '#ff5992',
    //     'A200': '#ff4081',
    //     'A400': '#ff2670',
    //     'A700': '#ffbfd5'
    // };
    // var customWarn = {
    //     '50': '#ffbfd5',
    //     '100': '#ffa6c4',
    //     '200': '#ff8cb3',
    //     '300': '#ff73a3',
    //     '400': '#ff5992',
    //     '500': '#ff4081',
    //     '600': '#ff2670',
    //     '700': '#ff0d5f',
    //     '800': '#f20053',
    //     '900': '#d9004a',
    //     'A100': '#ffd9e6',
    //     'A200': '#fff2f7',
    //     'A400': '#ffffff',
    //     'A700': '#bf0041'
    // };
    // $mdThemingProvider.definePalette('customPrimary', customPrimary);
    // $mdThemingProvider.definePalette('customWarn', customWarn);
    // $mdThemingProvider.definePalette('customAccent', customAccent);
    //
    // $mdThemingProvider.theme('default')
    //     .primaryPalette('customPrimary')
    //     .accentPalette('customAccent')
    //     .warnPalette('customWarn');

    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('pink');

    $urlRouterProvider
        .otherwise('/');
    $mdIconProvider
        .defaultIconSet('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.svg', 24);


        // .iconSet('social', 'img/icons/sets/social-icons.svg', 24)
};