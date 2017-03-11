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

    // vm.networkUsers = [];

    vm.networkUsers = [
        {
            name: 'User 1',
            lastSync: Date.now(),
            _id: '1234',
            following: true,
            isOnline: true
        },
        {
            name: 'Test User 2',
            lastSync: null,
            _id: '5678',
            following: false
        },
        {
            name: 'Another User 3',
            lastSync: null,
            _id: '4321',
            following: false
        }
    ];

    vm.testEvent = testEvent;

    function testEvent() {
        socketFactory.emit('local-client:buttonTest', {myData: 'just some data'});
    }

    function init() {
        // getSeenUsers();
        // AppService.getOnlineUsers();
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

        for (var i = 0; i < vm.networkUsers.length; i++) {
            vm.networkUsers[i]['online'] = false;
            for (var j = 0; j < data.length; j++) {
                if (vm.networkUsers[i]._id == data[j]._id) {
                    vm.networkUsers[i]['online'] = true;
                }
            }
        }
    });

    $scope.$on('update:networkUsers:disconnect', function(event, data) {
        vm.networkUsers.splice(vm.networkUsers.indexOf(data), 1);
    });

    $scope.$on('update:connection', function(event, data) {

        console.log('data', data);
        vm.networkUsers.forEach(function(user, index) {
            if (user._id === data._id) {
                user[index] = user;
            }
        })
    })




}