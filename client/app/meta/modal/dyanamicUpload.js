var util = require('../client/components/node/file.utils');
'use strict';

angular.module('glossa')
    .directive('dynamicUpload', dynamicUpload);

function dynamicUpload(fileSrvc) {
    var directive = {
        restrict: 'E',
        // replace: true,
        scope: {
            item: '=',
            currentFile: '=',
            notebook: '='
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
                if (fileSrvc.isAttached(scope.item.type, scope.currentFile)) {
                    return alert('This File already has an ' + scope.item.type + ' file attached to it.');
                }
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

            var targetPath = 'uploads/' + file.name + file.extension;

            if (!util.doesExist(targetPath)) {
                scope.currentFile.media[scope.item.type] = {
                    name: file.name,
                    description: '',
                    absolutePath: file.path,
                    type: file.type,
                    extension: file.extension
                };
            } else {
                return alert('A file with this name already exists');
            }

            // fileSrvc.attach(file, scope.item.type, scope.currentFile, scope.notebook);
            scope.$apply();
        });
    }
}