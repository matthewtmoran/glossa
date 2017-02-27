// 'use strict';
// var initInjector = angular.injector(['ng']);
// var $http = initInjector.get('$http');
// var ready = new Promise(function(resolve, reject){
//
//
// });
// var settings = fetch('/mySettingsUrl');

// Promise.all([ ready, settings ]).then(() => {
//     angular.bootstrap(document, app.name);
// });

angular.module('config', []);
window.onload = function(){
    // get injector object
    var initInjector = angular.injector(['ng']);
    // extract necessary angular services
    var $http = initInjector.get('$http');
    var $timeout = initInjector.get('$timeout');
    var $animate = initInjector.get('$animate');
    // do operations before bootstrap
    // get user sign in status
    $http({
        url : 'http://localhost:9090/api/session',
        method : 'GET'
    }).then(function successCallback(res){
            angular.module('config').constant('__session', res.data);
        },
        // not signed in {statusCode : 403} // Forbidden
        function failureCallback(res){
            console.log('Failed to get user settings...');

            angular.module('config').constant('__session', res.data);

        }).then(function(){
        console.log('Bootstrapping angular....');
        // start bootstrapping
        angular.bootstrap(document, ['glossa']);
        // add `_splash_fade_out` class to splash screen
        // when resolved after animation complete, remove element from DOM
        $animate.addClass(angular.element('.splash-screen'), '_splash_fade_out')
            .then(function(){
                angular.element('.splash-screen').remove();
            });
    });
};

angular.module('glossa', [
    'config',
    'ngAnimate',
    'ngMaterial',
    'ui.router',
    'simplemde',
    'ngSanitize',
    'md.data.table',
    'ngFileUpload',
    'ui.codemirror'
    // 'socket.io'
    // 'btford.socket-io'
    // 'mdWavesurfer'
    ])
    .config(config)
    .run(function($rootScope, $state, $injector, AppService, __session) {

        $state.go(__session.currentState, __session.currentStateParams);

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            __session.currentState = toState.name;
            __session.currentStateParams = toParams;
            AppService.updateSession(__session);

            //This keeps the state from redirecting away from the child state when that same child state is clicked.
            var redirect = toState.redirectTo;
            if (redirect) {
                if (angular.isString(redirect)) {
                    event.preventDefault();
                    $state.go(redirect, toParams);
                }
                else {
                    var newState = $injector.invoke(redirect, null, {toState: toState, toParams: toParams});
                    if (newState) {
                        if (angular.isString(newState)) {
                            event.preventDefault();
                            $state.go(newState);
                        }
                        else if (newState.state) {
                            event.preventDefault();
                            $state.go(newState.state, newState.params);
                        }
                    }
                }
            }
        })
});

//$socketProvider...custom socket library implementation
function config($stateProvider, $urlRouterProvider, $mdIconProvider, $mdThemingProvider ) {

    //set initial socket connection ... custom socket library implementation
    // $socketProvider.setConnectionUrl('http://localhost:9000');


    //material theme stuff...
    var customAccent = {
        '50': '#b80000',
        '100': '#d10000',
        '200': '#eb0000',
        '300': '#ff0505',
        '400': '#ff1f1f',
        '500': '#ff3838',
        '600': '#ff6b6b',
        '700': '#ff8585',
        '800': '#ff9e9e',
        '900': '#ffb8b8',
        'A100': '#ff6b6b',
        'A200': '#FF5252',
        'A400': '#ff3838',
        'A700': '#ffd1d1',
        'contrastDefaultColor': 'light',
    };
    $mdThemingProvider
        .definePalette('customAccent',
            customAccent);
    $mdThemingProvider.definePalette('glossaPalette', {
        '50': 'ffebee',
        '100': 'ffcdd2',
        '200': 'ef9a9a',
        '300': 'F5F5F5',
        '400': '9E9E9E',
        '500': '9E9E9E',
        '600': 'e53935',
        '700': 'd32f2f',
        '800': '616161',
        '900': 'b71c1c',
        'A100': '212121',
        'A200': 'FF5252',
        'A400': '212121',
        'A700': 'BDBDBD',
        'contrastDefaultColor': 'light',    // whether, by default, text         (contrast)
        // on this palette should be dark or light
        'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
            '200', '300', '400', 'A100'],
        'contrastLightColors': undefined    // could also specify this if default was 'dark'
    });
    $mdThemingProvider.theme('default')
        .primaryPalette('glossaPalette')
        .accentPalette('customAccent');
    $mdIconProvider
        .defaultIconSet('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.svg', 24);



    $urlRouterProvider.otherwise(function($injector, $location){
        var state = $injector.get('$state');
        state.go("corpus");
    });





}