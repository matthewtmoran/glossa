'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus.baseline', {
            url: '/baseline',
            template: '<baseline-component flex layout="column" markdown-files="vm.markdownFiles" current-file="vm.currentFile" notebooks-attachment="vm.notebookAttachment">',
            parent: 'corpus',
            resolve: {
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