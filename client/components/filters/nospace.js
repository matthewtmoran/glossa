'use strict';

angular.module('glossa')
    .filter('nospace', nospace);

function nospace() {
    return function (value) {
        return (!value) ? '' : value.replace(/ /g, '');
    };
}
//
// angular.module('glossa')
//     .filter('nospace', function () {
//         return function (value) {
//             return (!value) ? '' : value.replace(/ /g, '');
//         };
//     });