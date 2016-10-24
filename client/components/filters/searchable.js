'use strict';

angular.module('glossa')
    .directive('searchable', searchable);

function searchable(fileSrvc) {
    var directive = {
        restrict: 'A',
        link: searchableLink,
        scope: {},
        // require: '^^mainComponent',
        // scope: {
        //     parent: '^mainComponent'
        // }
    };
    return directive;

    function searchableLink(scope, element, attrs) {


        scope.$watch(attrs.ngModel, function(val) {

            // scope.$parent.$parent.vm.searchText = val;
            console.log('something changed', val);

            // fileSrvc.updateSearchText(val);

        });


    }
}