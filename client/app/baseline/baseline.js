'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus.baseline', {
            url: '/baseline',
            template: '<baseline-component markdown-files="vm.markdownFiles" current-file="vm.currentFile" notebook-attachment="vm.notebookAttachment">',
            parent: 'corpus'
        });
}