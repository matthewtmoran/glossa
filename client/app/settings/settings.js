'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('settings', {
            url: '/settings',
            template: '<settings-component previous-state="$resolve.PreviousState" flex layout="column">',
            resolve: {
                PreviousState: function ($state) {
                    var currentStateData = {
                        Name: $state.current.name || 'corpus.meta',
                        Params: $state.params,
                        URL: $state.href($state.current.name, $state.params)
                    };
                    return currentStateData;
                }
            }
        });
}