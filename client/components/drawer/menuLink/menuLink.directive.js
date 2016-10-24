'use strict';

angular.module('glossa')
    .directive('menuLink', menuLink);

function menuLink() {
    var directive = {
        scope: {
            section: '='
        },
        require: '^^drawerDirective',
        templateUrl: 'components/drawer/menuLink/menuLink.html',
        link: menuLinkLink
    };
    return directive;

    function menuLinkLink(scope, element, attrs, crtl) {
        var controller = crtl;
        // var controller = element.parent().controller();
        scope.focusSection = function () {
            // set flag to be used later when
            // $locationChangeSuccess calls openPage()
            controller.autoFocusContent = true;
        };
    }
}
