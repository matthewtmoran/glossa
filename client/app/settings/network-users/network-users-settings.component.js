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
        AppService.getOnlineUsers();
    }

    function getSeenUsers() {
            console.log('__user.connections', __user.connections);
        if (__user.connections) {
            vm.networkUsers = __user.connections;
        } else {
            vm.networkUsers = [];
        }

    }

    $scope.$on('update:networkUsers', function(event, data) {
        console.log('update:networkUsers listener' , data);
        console.log('data', data[0]);


        for (var i = 0; i < vm.networkUsers.length; i++) {
            vm.networkUsers[i]['online'] = false;
            for (var j = 0; j < data.length; j++) {
                if (vm.networkUsers[i]._id == data[j]._id) {
                    vm.networkUsers[i]['online'] = true;
                }
            }
        }

        console.log('   vm.networkUsers after check',    vm.networkUsers);


        // vm.networkUsers = data;

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