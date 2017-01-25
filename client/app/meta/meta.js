'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus.meta', {
            url: '/meta',
            template: '<meta-component markdown-files="vm.markdownFiles" current-file="vm.currentFile" notebook-attachment="vm.notebookAttachment">',
            parent: 'corpus',
        });
}