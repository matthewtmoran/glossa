'use strict';

angular.module('glossa')
    .directive('apsUploadFile', apsUploadFile);

function apsUploadFile(fileSrvc) {
    var directive = {
        restrict: 'E',
        scope: {
            buttonicon: '@buttonicon',
            filetypes: '@filetypes',
            tooltiptext: '@tooltiptext'
        },
        templateUrl: 'components/uploadbutton/uploadbtn.html',
        link: apsUploadFileLink
    };
    return directive;

    function apsUploadFileLink(scope, element, attrs) {

        var input = angular.element(element[0].querySelector('#fileInput'));
        var button = angular.element(element[0].querySelector('#uploadButton'));

        if (input.length && button.length) {
            button.click(function (e) {
                input.click();
            });
        }

        input.on('change', function (e) {
            var files = e.target.files;
            if (files[0]) {
                scope.fileName = files[0].name;
            } else {
                scope.fileName = null;
            }
            fileSrvc.attachFile(files);
            scope.$apply();
        });
    }
}
