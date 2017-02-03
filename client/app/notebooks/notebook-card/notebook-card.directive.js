'use strict';
//directive that displays a preview of notebooks data

angular.module('glossa')
    .directive('notebookCard', notebookCard);

function notebookCard($sce, $state) {
    var directive = {
        restrict: 'E',
        templateUrl: 'app/notebooks/notebook-card/notebook-card.directive.html',
        scope: {
            notebook: '=',
            viewDetails: '&',
            disconnectNotebook: '&'
        },
        link: notebookCardLink
    };
    return directive;

    function notebookCardLink(scope, element, attrs) {

        scope.isCorpus = false;

        //A rendered preview of the notebooks descriptions markdown
        scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));

        scope.disconnect = disconnect;
        scope.openDetails = openDetails;

        //if state is corups... use veiw only template
        if ($state.current.name.indexOf('corpus') > -1) {
            scope.isCorpus = true;
        }


        function disconnect(notebook) {
            scope.disconnectNotebook(notebook);
        }
        function openDetails(event, notebook) {
            scope.viewDetails(event, notebook);
        }
    }
}
