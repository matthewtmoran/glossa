'use strict';

angular.module('glossa')
    .component('networkSettingsComponent', {
        controller: NetworkSettings,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/network-users/network-users-settings.component.html'
    });

function NetworkSettings(SettingsService, $scope, AppService) {
    var vm = this;

    vm.$onInit = init;

    vm.networkUsers = [];

    function init() {
        AppService.getUserList();
        console.log('network-users settings init');
    }

    $scope.$on('update:networkUsers', function(event, data) {
        console.log('update:networkUsers listener' , data);
        console.log('data', data[0]);

        vm.networkUsers = data;

        // if (data.length < 1) {
        //     vm.networkUsers = [];
        // } else {
        //     vm.networkUsers = data;
        //     data.forEach(function(user) {
        //         if (vm.networkUsers.indexOf(user) < 0) {
        //             console.log('pushing data');
        //             vm.networkUsers.push(user);
        //         } else {
        //             vm.net
        //         }
        //     });
        // }


            console.log('vm.networkUsers', vm.networkUsers);

    });

    $scope.$on('update:networkUsers:disconnect', function(event, data) {
        vm.networkUsers.splice(vm.networkUsers.indexOf(data), 1);
    });




}