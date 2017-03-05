'use strict';

angular.module('glossa')
    .component('networkSettingsComponent', {
        controller: NetworkSettings,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/network-users/network-users-settings.component.html'
    });

function NetworkSettings(SettingsService, $scope, AppService, socketFactory, __user) {
    var vm = this;

    vm.$onInit = init;

    vm.networkUsers = [];

    vm.testEvent = testEvent;

    function testEvent() {
        socketFactory.emit('local-client:buttonTest', {myData: 'just some data'});
    }

    function init() {
        getSeenUsers();
        console.log('user ',__user);
        AppService.getOnlineUsers();
        console.log('network-users settings init');
    }

    function getSeenUsers() {
        if (__user.connections) {
            vm.networkUsers = __user.connections;
        } else {
            vm.networkUsers = [];
        }

    }

    $scope.$on('update:networkUsers', function(event, data) {
        console.log('update:networkUsers listener' , data);
        console.log('data', data[0]);

        vm.networkUsers.forEach(function(user) {
            if (user._id === data.userId) {
                user.online = true;
            }
        });

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