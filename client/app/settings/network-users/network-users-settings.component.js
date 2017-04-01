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

function NetworkSettings($scope, AppService, socketFactory, dialogSrvc, $q) {
    var vm = this;

    vm.$onInit = init;

    vm.networkUsers = [];


    vm.testEvent = testEvent;
    vm.toggleSharing = toggleSharing;
    vm.updateUserProfile = updateUserProfile;
    vm.uploadAvatar = uploadAvatar;
    vm.removeAvatar = removeAvatar;

    function init() {
        vm.userProfile = AppService.getUser();
        console.log('userProfile on Init:', vm.userProfile);

        AppService.getConnections();

        if (vm.settings.isSharing) {
            // AppService.getOnlineUsersSE();
        }
    }

    function removeAvatar(path) {
        AppService.removeAvatar(path);
    }

    function uploadAvatar(file) {
        $q.when(AppService.uploadAvatar(file)).then(function(data) {
            console.log('data', data);
            vm.userProfile.avatar = data.avatar;
        });
    }

    function updateUserProfile(userProfile) {
        console.log('TODO: use socket if sharing... Fallback to HTTP if not sharing...');
        console.log('updateUserProfile',userProfile);

        AppService.updateUserProfile(userProfile)
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
            if (!result) {
                return;
            }
            if (vm.settings.isSharing) {
                socketFactory.init();
                AppService.initListeners();
                AppService.getOnlineUsersSE();
            }
            if (!vm.settings.isSharing) {
                socketFactory.disconnect();
            }
            AppService.saveSettings(vm.settings);
        })
    }

    function testEvent() {
        socketFactory.emit('local-client:buttonTest', {myData: 'just some data'});
    }


    $scope.$on('update:networkUsers', function(event, data) {
        console.log('update:networkUsers listener', data);

        vm.networkUsers = data.onlineUsers;

        // var nonFollowingUsers = [];
        //
        // if (!data.onlineUsers.length) {
        //
        //     vm.networkUsers.forEach(function(client) {
        //         if (!client.following) {
        //             nonFollowingUsers.push(client);
        //         } else {
        //             client.online = false;
        //         }
        //     });
        //
        //     nonFollowingUsers.forEach(function(client) {
        //        vm.networkUsers.splice(vm.networkUsers.indexOf(client));
        //     });
        //
        //
        // } else {
        //     data.onlineUsers.forEach(function(connection) {
        //         var exists = false;
        //         vm.networkUsers.forEach(function(user, index) {
        //             if (connection._id === user._id) {
        //                 user.socketId = connection.socketId;
        //                 exists = true;
        //             }
        //          });
        //         if (!exists) {
        //             connection.online = true;
        //             vm.networkUsers.push(connection);
        //         }
        //     });
        // }

    });

    $scope.$on('update:networkUsers:disconnect', function(event, data) {
        vm.networkUsers.splice(vm.networkUsers.indexOf(data), 1);
    });


    $scope.$on('update:connection', function(event, data) {

        console.log('update:connection Heard in network-users-settings.component', data);

        for(var i = 0, len = vm.networkUsers.length; i < len; i++) {
            if (vm.networkUsers[i]._id === data.connection._id) {
                vm.networkUsers[i] = data.connection;
            }
        }

    });

    $scope.$on('update:connections', function(event, data) {
        console.log('update:connections Heard in network-users-settings.component', data);
        vm.networkUsers = data.connections;
    });

    // $scope.$watch('vm.userProfile.avatar', function(newValue, oldValue) {
    //     console.log('newValue', newValue);
    //     console.log('typeof newValue',typeof newValue);
    //
    //     if (newValue) {
    //         if (typeof newValue === 'string') {
    //             vm.imagePath = newValue;
    //         } else {
    //             vm.imagePath = window.URL.createObjectURL(newValue);
    //         }
    //     }
    // });



}