'use strict';

angular.module('glossa')
    .directive('genericUpload', genericUpload);

function genericUpload(fileSrvc) {
    var directive = {
        restrict: 'E',
        // replace: true,
        scope: {
            item: '=',
            currentFile: '=',
            currentNotebook: '='
        },
        templateUrl: 'app/meta/modal/dynamicUpload.html',
        link: dynamicUploadLink
    };
    return directive;

    function dynamicUploadLink(scope, element, attrs) {


        var button = angular.element(element[0].children[0]);
        var input = angular.element(element[0].children[1]);

        input.attr('accept', scope.item.accept);

        if (input.length && button.length) {
            button.click(function (e) {
                input.click();
            });
        }

        input.on('change', function (e) {
            // var files = e.target.files;
            // if (files[0]) {
            //     scope.fileName = files[0].name;
            // } else {
            //     scope.fileName = null;
            // }

            var file = e.target.files[0];

            scope.currentNotebook.media[scope.item.type] = {
                name: file.name,
                description: '',
                absolutePath: file.path,
                type: file.type,
                extension: file.extension
            };

            // fileSrvc.attach(file, scope.item.type, scope.currentFile, scope.notebook);
            scope.$apply();
        });
    }
}