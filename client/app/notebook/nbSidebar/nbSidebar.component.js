'use strict';

angular.module('glossa')
    .component('nbSidebarComponent', {
        controller: nbSidebarComponent,
        controllerAs: 'nbSbVm',
        templateUrl: 'app/notebook/nbSidebar/nbSidebar.html',
        transclude: true,
        bindings: {
            searchText: '=',
            currentFile: '='
        }
    });

function nbSidebarComponent() {
    var nbSbVm = this;


}