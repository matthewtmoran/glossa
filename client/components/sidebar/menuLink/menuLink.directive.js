'use strict';

angular.module('glossa')
    .directive('menuLink', menuLink);

function menuLink() {
    var directive = {
        scope: {
            section: '='
        },
        templateUrl: 'components/sidebar/menuLink/menuLink.html',
        link: menuLinkLink
    };
    return directive;

    function menuLinkLink(scope, element, attrs) {
        var controller = element.parent().controller();
        scope.focusSection = function () {
            // set flag to be used later when
            // $locationChangeSuccess calls openPage()
            controller.autoFocusContent = true;
        };
    }
}
