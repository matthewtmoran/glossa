'use strict';

angular.module('glossa')
    .directive('apsUploadFile', apsUploadFile);

function apsUploadFile(fileSrvc) {
    var directive = {
        restrict: 'E',
        scope: {
            buttonicon: '@buttonicon'
        },
        templateUrl: 'components/uploadbutton/uploadbtn.html',
        link: apsUploadFileLink
    };
    return directive;

    function apsUploadFileLink(scope, element, attrs) {

        var input = angular.element(element[0].querySelector('#fileInput'));
        var button = angular.element(element[0].querySelector('#uploadButton'));
        // var textInput = angular.element(element[0].querySelector('#textInput'));

        if (input.length && button.length) {
            // if (input.length && button.length && textInput.length) {
            button.click(function (e) {
                input.click();
            });
            // textInput.click(function (e) {
            //     input.click();
            // });
        }

        input.on('change', function (e) {
            var files = e.target.files;
            console.log('files', files);
            if (files[0]) {
                scope.fileName = files[0].name;
            } else {
                scope.fileName = null;
            }

            fileSrvc.uploadFile(files);
            // nodeSrvc.addFiles(files);
            scope.$apply();
        });
    }
}
