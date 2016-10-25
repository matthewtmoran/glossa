'use strict';

angular.module('glossa')
    .directive('navbarDirective', navBarDirective);

function navBarDirective(fileSrvc) {
    var directive = {
        restrict: 'E',
        replace: true,
        controller: NavbarCtrl,
        controllerAs: 'navVm',
        templateUrl: 'components/navbar/navbar.html',
        // link: navBarDirectiveLink
        bindToController: true,
        scope: {
            searchText: '='
        },
    };
    return directive;

    // function navBarDirectiveLink(scope, element, attrs) {
    //
    //
    // }
}
