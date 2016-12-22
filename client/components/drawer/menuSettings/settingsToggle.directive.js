'use strict';

angular.module('glossa')
    .directive('settingsToggle', menuToggle);

function menuToggle($timeout, drawerMenu, dialogSrvc) {
    var directive = {
        restrict: 'E',
        scope: true,
        templateUrl: 'components/drawer/menuSettings/settingsToggle.html',
        link: menuSettingslink
    };
    return directive;

    function menuSettingslink(scope, element, attrs) {

        var originatorEv;

        scope.openMenu = openMenu;
        scope.execute = execute;
        scope.deleteCorpus = deleteCorpus;
        scope.corpusDialog = corpusDialog;


        function execute(action, object) {
            if(angular.isFunction(scope[action])) {
                scope[action](object);
            }
        }

        function deleteCorpus(val) {
            drawerMenu.deleteCorpus(val);
        }

        function corpusDialog() {
            dialogSrvc.corpusDialog();
        }


        function openMenu($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

    }
}