'use strict';

angular.module('glossa')
    .directive('menuToggle', menuToggle);

function menuToggle($timeout) {
    var directive = {
        restrict: 'E',
        scope: {
          section: '='
        },
        templateUrl: 'components/sidebar/menutoggle/menuToggle.html',
        link: menuToggleLink
    };
    return directive;

    function menuToggleLink(scope, element, attrs) {
        var controller = element.parent().controller();

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