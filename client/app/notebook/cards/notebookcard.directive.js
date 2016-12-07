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

        if (scope.notebook.description) {
            scope.notebook.description = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));
        }


        scope.openExistinDialog = function(notebook) {
            postSrvc.existingPostDialog(notebook).then(function (res) {
                console.log('the response is here', res);
            })
        };
    }
}
