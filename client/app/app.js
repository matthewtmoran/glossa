'use strict';

angular.module('glossa', [
    'ngAnimate',
    'ngMaterial',
    'ui.router',
    'simplemde',
    'ngSanitize',
    'md.data.table',
    'ngFileUpload'
    // 'mdWavesurfer'
    ])
    .config(config)
    .run(function($rootScope, $state, $injector) {
        $rootScope.$on('$stateChangeStart',function (event, toState, toParams) {
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
})


function config($stateProvider, $urlRouterProvider, $mdIconProvider, $mdThemingProvider) {
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



    // $urlRouterProvider
    //     .otherwise('/corpus/:corpus:default');

    $urlRouterProvider.otherwise(function($injector, $location){
        var state = $injector.get('$state');
        // state.go("corpus", $location.corpus());
        state.go("corpus");
        return $location.path();
    });

    $mdIconProvider
        .defaultIconSet('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.svg', 24);
};