'use strict';

angular.module('glossa')
    .directive('drawerDirective', drawerDirective);

function drawerDirective() {
    var directive = {
        restrict: 'E',
        replace: true,
        controller: 'drawerCrtl',
        // transclude: true,
        controllerAs: 'dVm',
        templateUrl: 'components/drawer/drawer.html',
        // link: navBarDirectiveLink
        bindToController: true
    };
    return directive;

    // function navBarDirectiveLink(scope, element, attrs) {
    //
    //
    // }
}
