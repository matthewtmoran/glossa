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
                },

                // getState: function($state, AppService) {
                //     AppService.getSession().then(function(data){
                //         console.log('data', data);
                //         //go to the session state
                //         localStorage.setItem('session', JSON.stringify(data));
                //         $state.go(data.currentState, data.currentStateParams);
                //     });
                // },
                //
                // updateState: function($state, AppService) {
                //     var session = JSON.parse(localStorage.getItem('session'));
                //
                //     console.log('$state', $state);
                //     console.log('$state.current', $state.current);
                //     console.log('$state.current.name', $state.current.name);
                //
                //     //update the current state and params
                //     session.currentState = $state.current.name;
                //     session.currentStateParams = $state.params;
                //
                //     console.log('session before update', session);
                //     //
                //     // //update session data on server end
                //     AppService.updateSession(session).then(function(data) {
                //     //     //after reponse update local storage
                //         localStorage.setItem('session', JSON.stringify(data));
                //     });
                // }
            }
        });
}