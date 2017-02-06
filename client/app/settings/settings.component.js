angular.module('glossa')
    .component('settingsComponent', {
        controller: SettingsController,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/settings.component.html',
        bindings: {
            previousState:'='
        }
    });

function SettingsController($state, $rootScope, $scope, $resolve) {
    var vm = this;

    $onInit = function() {
        console.log('settings init');
    };


    vm.back = back;
    $scope.$watch('selectedIndex', selectedIndexWatch);


    function back() {
        $state.go(vm.previousState.Name, vm.previousState.Params);
    }


    //tab click events - changes child state
    function selectedIndexWatch(current, old) {
        switch (current) {
            case 0:
                $state.go('settings.project');
                // $location.url("/meta");
                break;
            case 1:
                $state.go('settings.about');
                // $location.url("/main.baseline");
                break;
            case 2:
                // $location.url("/view3");
                break;
        }
    }
}