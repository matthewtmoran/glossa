'use strict';

angular.module('glossa')
    .component('viewerEditorComponent', {
        controller: viewerEditorCtrl,
        controllerAs: 'veVm',
        templateUrl: 'components/viewerEditor/viewerEditor.html',
        transclude: true,
        bindings: {
            currentFile: '='
        }
    });

function viewerEditorCtrl($scope, $state) {
    var veVm = this;
    var neededBindings = 1;
    var stringBindingDeReg = $scope.$watch('veVm.currentFile', currentFileWatch);

    veVm.selectedIndex = 0;
    veVm.bindingsAreStabilized = false;

    $scope.$watch('selectedIndex', selectedIndexWatch);

    function selectedIndexWatch(current, old) {
        switch (current) {
            case 0:
                $state.go('corpus.meta');
                // $location.url("/meta");
                break;
            case 1:
                $state.go('corpus.baseline');
                // $location.url("/main.baseline");
                break;
            case 2:
                // $location.url("/view3");
                break;
        }
    }
    function currentFileWatch(newValue) {
        if (angular.isObject(newValue)) {
            stringBindingDeReg();
            neededBindings -= 1;

            onBindingsStabilize();
        }

    }
    function onBindingsStabilize() {
        if (neededBindings === 0) {
            console.log('everything is ready!');

            veVm.bindingsAreStabilized = true;
        } else {
            console.log(neededBindings + ' more bindings need to stabilize until onBindingsStabilize gets called');
        }
    }
}