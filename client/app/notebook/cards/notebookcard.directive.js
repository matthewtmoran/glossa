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
        if (scope.notebook.description) {
            //markdown preview
            scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));
        }
        //Opens notebook details
        //funciton is passed through scope
        scope.open = function(event, notebook) {
            scope.openDetails(event, notebook);
        };
    }
}
