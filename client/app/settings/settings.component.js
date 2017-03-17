'use strict';
//TODO: consider combining settigns service and appServicde
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

function SettingsController($state, $scope, AppService, SettingsService) {
    var vm = this;

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
            label: 'Sharing',
            state: 'settings.network',
            index: 3
        },
        {
            label: 'Hashtags',
            state: 'settings.hashtags',
            index: 4
        }
    ];

    vm.$onInit = init;
    vm.back = back;

    //keep index of tabs updated
    $scope.$watch('selectedIndex', selectedIndexWatch);


    function init() {
        //get user settings
        vm.settings = AppService.getSettings();
        SettingsService.getProject().then(function(data) {
            vm.project = data;
        });
    }

    //go back to previous parent state
    function back() {
        $state.go(vm.previousState.Name, vm.previousState.Params);
    }

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
            case 3:
                vm.selectedTab = vm.tabs[3];
                $state.go(vm.tabs[3].state);
                // $location.url("/view3");
                break;
        }
    }
}