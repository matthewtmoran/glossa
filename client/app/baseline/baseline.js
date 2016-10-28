'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main.baseline', {
            template: '<baseline-component layout="column" flex ng-if="veVm.bindingsAreStabilized" current-file="veVm.currentFile">'

            // url: '/meta',
            // templateUrl: 'app/baseline/baseline.html',
            // controller: 'baselineCrtl',
            // controllerAs: 'baselineVm'
        });
}