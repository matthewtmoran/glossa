'use strict';

var remote = require('electron').remote,
    path = require('path'),
    globalPaths = remote.getGlobal('userPaths');

angular.module('glossa')
    .directive('notebookCard', notebookCard);

function notebookCard($sce) {

    var directive = {
        restrict: 'E',
        scope: {
            notebook: '=',
            openDetails: '&'
        },
        templateUrl: 'app/notebook/cards/normalcard.html',
        link: notebookCardLink
    };
    return directive;

    function notebookCardLink(scope, element, attrs) {

        // if post is a normal post typw
        if (scope.notebook.description && scope.notebook.postType === 'normal') {
            //create image path
            if (scope.notebook.media.image) {
                scope.imagePath = path.join(globalPaths.static.image, scope.notebook.media.image.name) || '';
            }
            //create audio path
            if (scope.notebook.media.audio) {
                scope.audioPath = path.join(globalPaths.static.audio, scope.notebook.media.audio.name) || '';
            }
            //markdown preview
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));
        }
        //if post is an image post
        if (scope.notebook.media.image && scope.notebook.postType === 'image') {
            //define image path
            scope.imagePath = path.join(globalPaths.static.image, scope.notebook.media.image.name) || '';
            //set markdown text
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.image.caption || ''));
        }
        //if post is an audio post
        if (scope.notebook.media.audio && scope.notebook.postType === 'audio') {
            //define audio path
            scope.audioPath = path.join(globalPaths.static.audio, scope.notebook.media.audio.name) || '';
            //markdown text
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.audio.caption || ''));
        }

        //Opens notebook details
        //funciton is passed through scope
        scope.open = function(event, notebook) {
            scope.openDetails(event, notebook);
        };

    }
}
