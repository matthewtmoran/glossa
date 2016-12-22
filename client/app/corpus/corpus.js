'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('corpus', {
            url: '/',
            redirectTo:'corpus.meta',
            // abstract:true,
            template: '<corpus-component flex layout="column">',
            params: {
                user: {},
                corpus: 'default'
            }
        });
}