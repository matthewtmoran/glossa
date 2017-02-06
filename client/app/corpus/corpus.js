'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus', {
            url: '/corpus',
            redirectTo:'corpus.meta',
            // abstract: true,
            template: '<corpus-component markdown-files="$resolve.markdownFiles" flex layout="column">',
            params: {
                user: {},
                corpus: 'default'
            },
            resolve: {
                markdownFiles: function(markdownSrvc, $stateParams) {
                    return markdownSrvc.getFiles($stateParams.corpus);
                },
                PreviousState: function ($state) {
                    var currentStateData = {
                        Name: $state.current.name,
                        Params: $state.params,
                        URL: $state.href($state.current.name, $state.params)
                    };
                    return currentStateData;
                }
            }
        });
}