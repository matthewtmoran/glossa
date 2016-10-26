// 'use strict';
//
// angular.module('glossa')
//     .config(config);
//
// function config($stateProvider) {
//     $stateProvider
//         .state('main', {
//             url: '/',
//             // component: 'mainComponent',
//             // template: '<main-component>'
//             templateUrl: 'app/main/main.html',
//             controller: 'MainCtrl',
//             controllerAs: 'vm'
//         });
// }
//
'use strict';

angular.module('glossa')
    .config(config);

function config($stateProvider) {
    $stateProvider
        .state('main', {
            url: '/',
            // component: 'mainComponent',
            template: '<main-component flex layout="column">'
            // templateUrl: 'app/main/main.html',
            // controller: 'MainCtrl',
            // controllerAs: 'vm'
        });
}