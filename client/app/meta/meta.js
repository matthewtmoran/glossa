'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main.meta', {
            url: '/meta',
            template: '<meta-component ng-if="veVm.bindingsAreStabilized" current-file="veVm.currentFile">'
        });
}