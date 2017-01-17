'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus.baseline', {
            url: 'baseline',
            template: '<baseline-component layout="column" flex ng-if="veVm.bindingsAreStabilized" current-file="veVm.currentFile">',

            // templateUrl: 'app/baseline/baseline.html',
            // controller: 'baselineCrtl',
            // controllerAs: 'baselineVm'
        });
}