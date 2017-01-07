'use strict';


angular.module('glossa')
    .directive('uploadSelection', uploadSelection);

function uploadSelection(fileSrvc, $q) {
    var directive = {
        restrict: 'E',
        scope: {
            buttonid: '@buttonid',
            buttonicon: '@buttonicon',
            filetypes: '@filetypes',
            tooltiptext: '@tooltiptext',
            inputName: '@inputName',
            type: '@type',
        },
        require:"ngModel",
        templateUrl: 'components/uploadSelection/uploadSelection.html',
        link: apsUploadFileLink
    };
    return directive;

    function apsUploadFileLink(scope, element, attrs, ngModel) {

        // if (ngModel.$viewValue.length > 0) {
        //     scope.filePath = ngModel.$viewValue;
        // }

        var button = angular.element(element).find('.upload-button');
        var input = angular.element('input[name=' + scope.inputName + ']');
        // var input = angular.element(element).find('.upload-input');

        console.log('input', input);
        scope.removePreview = removePreview;

        if (input.length && button.length) {
            button.click(function(e) {
                console.log('button click');
                input.click(function() {
                    console.log('this', this);
                });
            });
        }

        input.on('change', function(e) {
            console.log('addfile');
            var file = e.target.files[0];
            if (file) {
                ngModel = file;
                scope.filePath = window.URL.createObjectURL(file);
                console.log('scope.filePath', scope.filePath);
                scope.$apply();
            }
        });



        function removePreview(event) {
            scope.filePath = null;
            ngModel = null;
            input.val(null);
        }
    }
}
