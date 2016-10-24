'use strict';

angular.module('glossa')
    .directive('tabbar', tabbar);

function tabbar(fileSrvc) {
    var directive = {
        restrict: 'E',
        replace: true,
        controller: 'tabCtrl',
        controllerAs: 'tabVm',
        templateUrl: 'components/tabbar/tabbar.html',
        // link: navBarDirectiveLink
        bindToController: true
    };
    return directive;

    // function navBarDirectiveLink(scope, element, attrs) {
    //
    //
    // }
}
