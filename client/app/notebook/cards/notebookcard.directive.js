'use strict';

angular.module('glossa')
    .directive('notebookListItem', notebookListItem);

function notebookListItem(postSrvc, $mdDialog,$sce) {

    var directive = {
        restrict: 'E',
        scope: {
            notebook: '='
        },
        templateUrl: 'app/notebook/cards/normalcard.html',
        link: notebookListItemLink
    };
    return directive;

    function notebookListItemLink(scope, element, attrs) {

        if (scope.notebook.description && scope.notebook.postType === 'normal') {
            scope.notebook.description = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));
        }
        if (scope.notebook.media.image && scope.notebook.postType === 'image') {
            scope.notebook.media.image.caption = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.image.caption));
        }
        if (scope.notebook.media.audio && scope.notebook.postType === 'audio') {
            scope.notebook.media.audio.caption = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.media.audio.caption));
        }

        scope.openExistinDialog = function(notebook) {
            postSrvc.existingPostDialog(notebook).then(function (res) {
                console.log('the response is here', res);
            })
        };
    }
}
