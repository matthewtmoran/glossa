'use strict';

angular.module('glossa')
    .directive('notebookListItem', notebookListItem);

function notebookListItem(postSrvc, $mdDialog) {
    // var getTemplate = function(contentType) {
    //     var template = '';
    //     switch(contentType) {
    //         case 'image':
    //             template = imageTemplate;
    //             break;
    //         case 'audio':
    //             template = videoTemplate;
    //             break;
    //         case 'normal':
    //             template = noteTemplate;
    //             break;
    //     }
    //     return template;
    // }

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

        scope.openExistinDialog = function(notebook) {
            postSrvc.existingPostDialog(notebook).then(function (res) {
                console.log('the response is here', res);
            })
        };
    }
}
