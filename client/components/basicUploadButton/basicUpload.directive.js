'use strict';
var util = require('../client/components/node/file.utils');


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
            tooltiptext: '@tooltiptext',
            type: '@type'
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
            var targetPath = 'uploads/' + scope.type + '/' + file.name;
            if (util.doesExist(targetPath)) {
                return alert('A file with this name already exists.  Choose another file');
            }

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
