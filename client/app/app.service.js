var ipc = require('electron').ipcRenderer;
var dialog  = require('electron').remote.dialog;

angular.module('glossa')
    .factory('AppService', AppService);

function AppService($http, socketFactory, $rootScope, $mdToast, Notification, __user, Upload, $state, $timeout, $window) {
    var service = {

        //socket functions
        initListeners: initListeners,
        getOnlineUsersSE: getOnlineUsersSE,
        getAllUserUpdates: getAllUserUpdates,
        broadcastUpdates: broadcastUpdates,
        updateUserProfile: updateUserProfile,

        //dealing with __user constant
        getUser: getUser,
        isSharing: isSharing,
        getSettings: getSettings,
        getConnections: getConnections,

        //updating __user constant
        uploadAvatar: uploadAvatar,
        removeAvatar: removeAvatar,
        updateSession: updateSession,
        saveSettings: saveSettings,
        toggleFollow: toggleFollow
    };

    //TODO: move ipc listeners to their own service
    ipc.on('changeState', ipcChangeState);
    ipc.on('import:project', ipcImportProject);

    // initListeners();
    return service;

    function getUser() {
        return __user;
    }

    function isSharing() {
        return __user.isSharing;
    }

    function getSettings() {
        return __user.settings;
    }

    function getConnections() {
        socketFactory.emit('get:connections')
    }

    function uploadAvatar(file) {
        return Upload.upload({
            url: 'api/user/avatar',
            data: {files: file},
            arrayKey: '',
            headers: { 'Content-Type': undefined }
        }).then(function (resp) {

            __user.avatar = resp.data.avatar;

            return resp.data;
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            // console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    }

    function removeAvatar(filePath) {
        var data = {filePath: filePath};
        return $http.put('/api/user/' + __user._id + '/avatar', data)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    //TODO: emit update:userProfile in the avatar changes......

    function updateUserProfile(userProfile) {
        var userString = angular.toJson(userProfile);
        socketFactory.emit('update:userProfile', {userProfile: userString})
    }

    function toggleFollow(user) {
        var userString = angular.toJson(user);
        socketFactory.emit('update:following', {connection: userString});
    }

    function saveSettings(settings) {
        console.log('Setting being updated...');
        return $http.put('/api/user/' + __user._id + '/settings', settings)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    //should only be called on stateChange
    function updateSession(session) {
        return $http.put('/api/user/' + __user._id + '/session', session)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    ///////////////////
    //Socket Emitters//
    ///////////////////


    function getOnlineUsersSE() {
        socketFactory.emit('get:networkUsers')
    }

    //look for all updates from users that are being followed
    function getAllUserUpdates() {
        var msg = 'Looking for updates from all users...';
        var delay = 4000;

        Notification.show({
            message: msg,
            hideDelay: delay
        });

        socketFactory.emit('request:AllUserUpdates')
    }

    //broad cast updates to users that follow
    function broadcastUpdates(data) {
        socketFactory.emit('broadcast:Updates', data);
    }

    function initListeners() {

        //hand shake
        socketFactory.on('request:SocketType', function(data) {
            console.log("Heard 'request:SocketType' in appService.data:", data);

            var msg = 'server requesting socket type... ';
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            var socketData = {
                type: 'local-client',
                socketId: data.socketId
            };

            socketFactory.emit('return:SocketType', socketData);

        });

        //handshake success
        socketFactory.on('notify:server-connection', function(data) {
            console.log("Heard 'notify:server-connection' in appFactory.data:", data);

            var msg = 'connected to local server';
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

        });

        //any time external client this should be heard
        socketFactory.on('send:updatedUserList', function(data) {
            console.log('Heard : send:updatedUserList in app.service', data.onlineUsers);

            var onlineClients = [];
            data.onlineUsers.forEach(function(client) {
                if (client.online) {
                    onlineClients.push(client);
                }
            });

            var msg = 'Users list count: ' + onlineClients.length;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });


            // checkForUpdates(data.onlineUsers);

            console.log('$broadcast : update:networkUsers');
            $rootScope.$broadcast('update:networkUsers', {onlineUsers: data.onlineUsers})

        });

        socketFactory.on('normalize:notebooks', function(data) {
            console.log('Heard : normalize:notebooks in app.service', data);

            $rootScope.$broadcast('normalize:notebooks', data)

        });

        //when external-client disconnects
        socketFactory.on('userDisconnected', function(data) {
            console.log('$broadcast : update:networkUsers:disconnect');
            $rootScope.$broadcast('update:networkUsers:disconnect', data)
        });


        //when external-client makes changes
        socketFactory.on('notify:externalChanges', function(data) {
            console.log('Heard : notify:externalChanges in app.service', data);
            var msg = 'Data synced with ' + data.connection._id;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            // console.log('$broadCast event update:connection');
            // $rootScope.$broadcast('update:connection', data.connection);
            console.log('$broadCast event update:externalData');
            $rootScope.$broadcast('update:externalData', data);
        });


        socketFactory.on('update:external-client', function(data) {
            console.log("Heard : update:external-client in app.service");

            var msg = 'User ' + data.createdBy._id;
            var delay = 3000;

            Notification.show({
                message: msg,
                hideDelay: delay
            });

            console.log('$broadCast event update:externalData');
            $rootScope.$broadcast('update:externalData', {updatedData: data});
        });

        //update dynamic data that connection may update manually
        socketFactory.on('update:connectionInfo', function(data) {

            console.log('update:connectionInfo', data);

            $rootScope.$broadcast('update:connection', data);

        });

        socketFactory.on('update:connection', function(data) {
            $rootScope.$broadcast('update:connection', data);
        });

        //Listen for connections list
        //broadcast all connections to controllers that display connections
        socketFactory.on('send:connections', function(data) {
            console.log('send:connections Hear in app.service', data);
           $rootScope.$broadcast('update:connections', data);
        });

        //TODO: currently we do not use consider using socket vs http
        socketFactory.on('import:project', function(data) {
            alert('importing project....');
        });

    }

    //Electron Renderer listeners (from main process)

    function ipcImportProject(event, message) {
        var options = {
            filters: [{ name: 'Glossa File (.glossa)', extensions: ['glossa'] }]
        };

        dialog.showOpenDialog(options, function(selectedFiles) {

                if (selectedFiles) {

                    $http.post('/api/project/import', {projectPath: selectedFiles[0]})
                        .then(function successCallback(response) {
                            $window.location.reload();
                        }, function errorCallback(response) {
                            console.log('There was an error', response);
                            $window.location.reload();
                        });
                }
            }
        );
    }

    function ipcChangeState(event, state) {
        $state.go(state, {});
    }
}