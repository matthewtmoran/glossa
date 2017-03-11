'use strict';

angular.module('glossa')
    .component('networkSettingsComponent', {
        controller: NetworkSettings,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/network-users/network-users-settings.component.html',
        bindings: {
            settings: '='
        }
    });

function NetworkSettings(SettingsService, $scope, AppService, socketFactory, dialogSrvc) {
    var vm = this;

    vm.$onInit = init;

    vm.networkUsers = [];

    // vm.networkUsers = [
    //     {
    //         name: 'User 1',
    //         lastSync: Date.now(),
    //         _id: '1234',
    //         following: true,
    //         isOnline: true
    //     },
    //     {
    //         name: 'Test User 2',
    //         lastSync: null,
    //         _id: '5678',
    //         following: false
    //     },
    //     {
    //         name: 'Another User 3',
    //         lastSync: null,
    //         _id: '4321',
    //         following: false
    //     }
    // ];

    vm.testEvent = testEvent;
    vm.toggleSharing = toggleSharing;

    function init() {
        vm.networkUsers = AppService.getConnections();

        if (vm.settings.isSharing) {
            AppService.getOnlineUsersSE();
        }
    }

    function toggleSharing() {
        var options = {};
        if (!vm.settings.isSharing) {
            options.title = 'Are you sure you want to turn OFF sharing?';
            options.textContent = 'By clicking yes, you will not be able to sync data with other users...';
        } else {
            options.title = 'Are you sure you want to turn ON sharing?';
            options.textContent = 'By clicking yes, you will automatically sync data with other users...';
        }

        dialogSrvc.confirmDialog(options).then(function(result) {
            console.log('result', result);
            if (!result) {
                return;
            }
            if (vm.settings.isSharing) {
                console.log('sharing is enabled');
                socketFactory.init();
                AppService.initListeners();
                AppService.getOnlineUsersSE();
            }
            if (!vm.settings.isSharing) {
                console.log('sharing should be disabled');
                socketFactory.disconnect();
            }
            AppService.saveSettings(vm.settings);
        })
    }


    function testEvent() {
        socketFactory.emit('local-client:buttonTest', {myData: 'just some data'});
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