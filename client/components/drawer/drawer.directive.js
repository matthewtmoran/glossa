'use strict';

angular.module('glossa')
    .directive('drawerDirective', drawerDirective);

function drawerDirective(dialogSrvc) {
    var directive = {
        restrict: 'E',
        replace: true,
        controller: 'drawerCrtl',
        controllerAs: 'dVm',
        templateUrl: 'components/drawer/drawer.html',
        // link: drawerDirectiveLink,
        bindToController: true
    };
    return directive;
}
