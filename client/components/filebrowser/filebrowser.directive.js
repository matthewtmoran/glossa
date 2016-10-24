'use strict';

angular.module('glossa')
    .directive('fileBrowser', fileBrowser);

function fileBrowser() {
    var directive = {
        restrict: 'E',
        templateUrl: 'components/filebrowser/filebrowser.html'
    };
    return directive;
}
