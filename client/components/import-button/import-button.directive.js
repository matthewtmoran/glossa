'use strict';
//directive that displays a wave-preview of notebooks data

angular.module('glossa')
    .directive('importProject', importProject);

function importProject() {
    var directive = {
        restrict: 'E',
        template: '',

        // templateUrl: 'app/notebooks/notebook-card/notebook-card.directive.html',
        link: importProjectLink
    };
    return directive;

    function importProjectLink(scope, element, attrs) {



    }
}
