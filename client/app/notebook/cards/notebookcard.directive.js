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


        if (scope.notebook.description && scope.notebook.postType === 'normal') {
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));
        }
        if (scope.notebook.media.image && scope.notebook.postType === 'image') {
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.image.caption));
        }
        if (scope.notebook.media.audio && scope.notebook.postType === 'audio') {
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.audio.caption));
        }


        scope.open = function(event, notebook) {
            scope.openDetails(event, notebook);
        };

    }
}
