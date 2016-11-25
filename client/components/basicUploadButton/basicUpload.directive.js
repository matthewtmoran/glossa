'use strict';

angular.module('glossa')
    .directive('basicUpload', basicUpload);

function basicUpload(fileSrvc) {
    var directive = {
        restrict: 'E',
        scope: {
            parentbinding: '=',
            buttonid: '@buttonid',
            buttonicon: '@buttonicon',
            filetypes: '@filetypes',
            tooltiptext: '@tooltiptext'
        },
        templateUrl: 'components/basicUploadButton/basicUpload.html',
        link: apsUploadFileLink
    };
    return directive;

    function apsUploadFileLink(scope, element, attrs) {


        var button = angular.element(element[0].children[0]);
        var input = angular.element(element[0].children[1]);

        if (input.length && button.length) {
            button.click(function (e) {
                input.click();
            });
        }

        input.on('change', function (e) {
            var file = e.target.files[0];

            scope.parentbinding = {
                name: file.name,
                absolutePath: file.path,
                type: file.type,
                extension: file.extension
            };

            scope.$apply();
        });
    }
}
