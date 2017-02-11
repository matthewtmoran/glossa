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

function SettingsController($state, $scope, SettingsService, $timeout) {
    var vm = this;

    vm.$onInit = function() {
        //get user settings
        SettingsService.getSettings().then(function(data) {
            vm.settings = data;
        });
    };

    vm.back = back;

    //Settings Tabs
    vm.tabs = [
        {
            label: 'Project',
            state: 'settings.project',
            index: 0
        },
        {
            label: 'Media',
            state: 'settings.media',
            index: 1
        },
        {
            label: 'About',
            state: 'settings.about',
            index: 2
        },
        {
            label: 'Hashtags',
            state: 'settings.hashtags',
            index: 3
        }
    ];

    //keep index of tabs updated
    $scope.$watch('selectedIndex', selectedIndexWatch);

    //tab click events - changes child state
    function selectedIndexWatch(current, old) {
        switch (current) {
            case 0:
                vm.selectedTab = vm.tabs[0];
                $state.go(vm.tabs[0].state);
                // $location.url("/meta");
                break;
            case 1:
                vm.selectedTab = vm.tabs[1];
                $state.go(vm.tabs[1].state);
                // $state.go('settings.about');
                // $location.url("/main.baseline");
                break;
            case 2:
                vm.selectedTab = vm.tabs[2];
                $state.go(vm.tabs[2].state);
                // $location.url("/view3");
                break;
        }
    }

    //go back to previous parent state
    function back() {
        $state.go(vm.previousState.Name, vm.previousState.Params);
    }
}