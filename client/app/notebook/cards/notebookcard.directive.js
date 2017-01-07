'use strict';

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
            //markdown preview
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));
        }
        //if post is an image post
        if (scope.notebook.media.image && scope.notebook.postType === 'image') {
            //set markdown text
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.image.caption || ''));
        }
        //if post is an audio post
        if (scope.notebook.media.audio && scope.notebook.postType === 'audio') {
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
