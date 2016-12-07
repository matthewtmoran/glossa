'use strict';

angular.module('glossa')
    .directive('convertIcons', convertIcons);

function convertIcons($timeout) {
    var directive = {
        restrict: 'A',
        scope: {},
        link: convertIconsLink
    };
    return directive;

    function convertIconsLink(scope, element, attrs) {

        // $timeout(function() {
        //     angular.element('.editor-toolbar > a').each(function(index, el) {
        //         var ele = angular.element(el);
        //
        //         var myClass = ele.attr("class");
        //
        //         angular.element(el).append('<md-icon md-ink-ripple="#e9e9e9" class="md-icon-button material-icons ' + myClass + '" ></md-icon>');
        //
        //
        //         // scope.$apply();
        //     })
        // }, 100)
    };
}