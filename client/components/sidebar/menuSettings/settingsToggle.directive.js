'use strict';

angular.module('glossa')
    .directive('settingsToggle', menuToggle);

function menuToggle($timeout) {
    var directive = {
        restrict: 'E',
        scope: {
            section: '='
        },
        templateUrl: 'components/sidebar/menuSettings/settingsToggle.html',
        link: menuSettingslink
    };
    return directive;

    function menuSettingslink(scope, element, attrs) {
        console.log('scope.section', scope.section);
        var controller = element.parent().controller();

        var originatorEv;

        scope.settingsOpen = settingsOpen;
        scope.toggleSettings = toggleSettings;
        scope.openMenu = openMenu;

        function settingsOpen() {
            return controller.isSettingsOpen(scope.section);
        }

        function toggleSettings() {
            controller.toggleSettingsOpen(scope.section);
        }
        function openMenu($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

    }
}