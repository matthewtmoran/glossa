'use strict';
//directive that displays a wave-preview of notebooks data

angular.module('glossa')
    .directive('notebookCard', notebookCard);

function notebookCard($sce, $state, UserService, $timeout, __user) {
    var directive = {
        restrict: 'E',
        templateUrl: 'app/notebooks/notebook-card/notebook-card.directive.html',
        scope: {
            notebook: '=',
            viewDetails: '&',
            disconnectNotebook: '&',
            uniqueUsers: '='
        },
        link: notebookCardLink
    };
    return directive;

    function notebookCardLink(scope, element, attrs) {


        if (scope.notebook.createdBy._id !== __user._id) {

            scope.notebook.canEdit = false;

        }

        if (scope.notebook.isNew) {
            element.addClass('new-data');
            $timeout(function() {
                element.removeClass('new-data');
            }, 5000)
        }

        scope.isCorpus = false;

        if ($state.current.name.indexOf('corpus') > -1) {
            scope.isCorpus = true;
        }

        // if ($state.current.name === 'notebook') {
        //     if (scope.uniqueUsers[scope.notebook.createdBy]) {
        //         scope.notebookCreator = scope.uniqueUsers[scope.notebook.createdBy];
        //     } else if (!scope.uniqueUsers[scope.notebook.createdBy]) {
        //         UserService.getUser(scope.notebook.createdBy).then(function(data) {
        //             scope.uniqueUsers[scope.notebook.createdBy] = data;
        //             scope.notebookCreator = data;
        //         });
        //     }
        // }


        //A rendered wave-preview of the notebooks descriptions markdown
        scope.previewText = $sce.trustAsHtml(SimpleMDE.markdown(scope.notebook.description));

        scope.disconnect = disconnect;
        scope.openDetails = openDetails;

        //if state is corups... use veiw only template



        function disconnect(notebook) {
            scope.disconnectNotebook(notebook);
        }
        function openDetails(event, notebook) {
            scope.viewDetails(event, notebook);
        }
    }
}
