'use strict';
var util = require('../client/components/node/file.utils'),
    path = require('path'),
    remote = require('electron').remote,
    globalPaths = remote.getGlobal('userPaths');


angular.module('glossa')
    .directive('uploadSelection', uploadSelection);

function uploadSelection(fileSrvc, $q) {
    var directive = {
        restrict: 'E',
        scope: {
            parentbinding: '=',
            buttonid: '@buttonid',
            buttonicon: '@buttonicon',
            filetypes: '@filetypes',
            tooltiptext: '@tooltiptext',
            type: '@type',
        },
        require:"^form",
        templateUrl: 'components/uploadSelection/uploadSelection.html',
        link: apsUploadFileLink
    };
    return directive;

    function apsUploadFileLink(scope, element, attrs, form) {

        if (scope.parentbinding) {
            console.log('scope.parentbinding', scope.parentbinding);
            console.log('globalPaths.static.root', globalPaths.static.root);
            scope.filePath = path.join(globalPaths.static.trueRoot, scope.parentbinding.path);
        }


        var button = angular.element(element).find('.md-icon-button');
        var input = angular.element(element).find('.upload-input');
        scope.removePreview = removePreview;

        if (input.length && button.length) {
            button.click(function (e) {
                input.click();
            });
        }

        input.on('change', function (e) {
            var file = e.target.files[0];
            var targetPath;
            //if there is no file, return
            if (!file) {
                return;
            } else {
                targetPath = path.join(globalPaths.static.root, scope.type, file.name);
                console.log('targetPath', targetPath);
                if (util.doesExist(targetPath)) {
                    return alert('A file with this name already exists.  Choose another file');
                }
            }

            form.$dirty = true;
            form.$pristine = false;

            var writePath = path.join(globalPaths.static.root, scope.type, file.name);

            util.copyWrite2(file.path, writePath).then(function(result) {
                console.log('globalPaths.static.root', globalPaths.static.root);
                scope.filePath = path.join(globalPaths.static.root, scope.type, file.name);

                console.log('scope.filePath', scope.filePath);

                console.log('scope.parentbinding', scope.parentbinding);

                scope.parentbinding = {
                    name: file.name,
                    path: path.join(globalPaths.relative.root, scope.type, file.name),
                    type: file.type,
                    extension: file.extension
                };

                console.log('scope.parentbinding', scope.parentbinding);

                scope.$apply();
                //create object for database
            });


        });

        function removePreview(event) {
            event.preventDefault();
            util.removeItem(scope.filePath).then(function(result) {
                scope.filePath = null;
                scope.parentbinding = null;
                input.val(null);
                scope.$apply();
            }).catch(function(err) {
                console.log('There was an error removing file', err)
            })
        }
    }
}
