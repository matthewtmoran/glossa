'use strict';

angular.module('glossa')
    .directive('menuToggle', menuToggle);

function menuToggle($timeout) {
    var directive = {
        restrict: 'E',
        scope: {
          section: '='
        },
        require: '^^drawerDirective',
        templateUrl: 'components/drawer/menutoggle/menuToggle.html',
        link: menuToggleLink
    };
    return directive;

    function menuToggleLink(scope, element, attrs, crtl) {
        var controller = crtl;
        // var controller = element.parent().controller();

        scope.isOpen = isOpen;
        scope.toggle = toggle;

        function isOpen() {
            return controller.isOpen(scope.section);
        }

        function toggle() {
            controller.toggleOpen(scope.section);
        }

    }
}