'use strict';

angular.module('glossa')
    .component('baselineComponent', {
        controller: baselineCtrl,
        controllerAs: 'blVm',
        templateUrl: 'app/baseline/baseline.html',
        transclude: true,
        bindings: {
            currentFile: '=',
            notebookAttachment: '=',
            markdownFiles: '='
        },
        require: {
            parent: '^^corpusComponent'
        }
    });

function baselineCtrl($scope, fileSrvc, $mdDialog, baselineSrvc, notebookSrvc) {
    var blVm = this;

    blVm.textContent = '';

    blVm.codemirrorLoaded = codemirrorLoaded;


    function codemirrorLoaded(_editor) {
        console.log('_editor', _editor);

        _editor.setOption('lineNumbers', true)



    }

    blVm.$onInit = init;

    function init() {

        // getMediaData(blVm.currentFile)


    }

    $scope.$watch('blVm.currentFile', function(newValue) {
        blVm.audioPath = '';
        blVm.imagePath = '';
        getMediaData(newValue)
    });

    function getMediaData(file) {
        if (file.attachment) {
            notebookSrvc.findNotebook(file.attachment.notebookId).then(function(notebook) {
                blVm.audioPath = notebook.media.audio.path ||'';
                blVm.imagePath = notebook.media.image.path ||'';
            });
            return;
        }
        if (blVm.currentFile.media.audio) {
            blVm.audioPath = blVm.currentFile.media.audio.path || null;
        }

        if (blVm.currentFile.media.image) {
            blVm.imagePath = blVm.currentFile.media.image.path || null;
        }
    }


    function getTextContent(file) {
        baselineSrvc.readContent(file, function(result) {
            blVm.textContent = result;
            $scope.$apply();
        });
    }

    function getAudioImagePath() {
        if (blVm.currentFile.media.audio) {
            blVm.audioPath = path.join(globalPaths.static.trueRoot, blVm.currentFile.media.audio.path)
        }
        if (blVm.currentFile.media.image) {
            blVm.imagePath = path.join(globalPaths.static.trueRoot, blVm.currentFile.media.image.path)
        }
    }

    blVm.update = update;

    function update() {
        baselineSrvc.updateContent(blVm.currentFile, blVm.textContent);
    }
}

