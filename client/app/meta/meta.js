'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus.meta', {
            url: '',
            template: '<meta-component ng-if="veVm.bindingsAreStabilized" current-file="veVm.currentFile">'
        });
}