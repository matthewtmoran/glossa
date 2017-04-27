
// import { remote, ipcRenderer } from 'electron';
// const ipc = require('electron').ipcRenderer;
// const dialog  = require('electron').remote.dialog;

// const electron = require('electron');
// const remote = electron.remote;
// var ipc = window.require('electron').ipcRenderer;
// var dialog  = window.require('electron').remote.dialog;
export class RootService {
  constructor($http, $rootScope, __user, $state, $window, SocketService, NotificationService, Upload) {
    'ngInject';
    //Notification
    //Upload

    this.$http = $http;
    this.$rootScope = $rootScope;
    this.__user = __user;
    this.$state = $state;
    this.$window = $window;
    this.socketService = SocketService;
    this.NotificationService = NotificationService;
    this.Upload = Upload;

  //TODO: move ipc listeners to their own service
  //   ipc.on('changeState', this.ipcChangeState.bind(this));
  //   ipc.on('import:project', this.ipcImportProject.bind(this));

  }


  ipcImportProject(event, message) {
    let options = {
      filters: [{ name: 'Glossa File (.glossa)', extensions: ['glossa'] }]
    };

    dialog.showOpenDialog(options, (selectedFiles) => {

        if (selectedFiles) {

          this.$http.post('/api/project/import', {projectPath: selectedFiles[0]})
            .then((response) => {
              this.$window.location.reload();
            })
            .catch((response) => {
              console.log('There was an error', response);
              this.$window.location.reload();
            });
        }
      }
    );
  }

  ipcChangeState(event, state) {
    console.log('TODO: update state....')
    console.log('ipcChangeState', state);
    this.$state.go(state, {});
  }

  getUser() {
    return this.__user;
  }

  isSharing() {
    return this.__user.isSharing;
  }

  getSettings() {
    return this.__user.settings;
  }

  getConnections() {
    this.socketService.emit('get:connections')
  }

  getProject() {
    return this.$http.get('/api/project/')
      .then((response) => {
        return response.data[0];
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  getCorporia() {
    return this.$http.get('/api/corporia')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  
  uploadAvatar(file) {
    return this.Upload.upload({
      url: 'api/user/avatar',
      data: {files: file},
      arrayKey: '',
      headers: {'Content-Type': undefined}
    }).then((resp) => {
      console.log('TODO: consider not updating here becuase we set user avatar in other component....');

      this.__user.avatar = resp.data.avatar;

      return resp.data;
    }).catch((resp) => {
      console.log('Error status: ' + resp.status);
    });
    //   .then((evt) => {
    //   console.log('TODO: fixe progress.... or not')
    //   // let progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
    //   // console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
    // });
  }

  removeAvatar(filePath) {
    let data = {filePath: filePath};
    return this.$http.put(`/api/user/${this.__user._id}/avatar`, data)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  

  saveSettings(settings) {
    console.log('Setting being updated...');
    return $http.put(`/api/user/${this.__user._id}/settings`, settings)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });

  }


  //should only be called on stateChange
  updateSession(session) {
    return this.$http.put(`/api/user/${this.__user._id}/session`, session)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }
  

  updateUserProfile(userProfile) {
    let userString = angular.toJson(userProfile);
    this.socketService.emit('update:userProfile', {userProfile: userString})
  }

  toggleFollow(user) {
    let userString = angular.toJson(user);
    this.socketService.emit('update:following', {connection: userString});
  }


  getOnlineUsersSE() {
    this.socketFactory.emit('get:networkUsers')
  }

  //look for all updates from users that are being followed
  getAllUserUpdates() {
    let msg = 'Looking for updates from all users...';
    let delay = 4000;

    this.NotificationService.show({
      message: msg,
      hideDelay: delay
    });

    this.socketService.emit('request:AllUserUpdates')
  }

  //broad cast updates to users that follow
  broadcastUpdates(data) {
    this.socketService.emit('broadcast:Updates', data);
  }

  initListeners() {
    console.log('initListeners');
    // hand shake
    this.socketService.on('request:SocketType', (data) => {
      console.log("Heard 'request:SocketType' in rootService:", data);

      let msg = 'server requesting socket type... ';
      let delay = 3000;


      this.NotificationService.show({
        message: msg,
        hideDelay: delay
      });

      let socketData = {
        type: 'local-client',
        socketId: data.socketId
      };

      console.log('Emitting: return:SocketType');
      this.socketService.emit('return:SocketType', socketData);

    });

    // handshake success
    this.socketService.on('notify:server-connection', (data) => {
      console.log("Heard 'notify:server-connection' in rootService.data:", data);

      let msg = 'connected to local server';
      let delay = 3000;

      this.NotificationService.show({
        message: msg,
        hideDelay: delay
      });

    });

    //any time external client this should be heard
    this.socketService.on('send:updatedUserList', (data) => {
      console.log('Heard : send:updatedUserList in app.service', data.onlineUsers);

      let onlineClients = [];
      data.onlineUsers.forEach((client) => {
        if (client.online) {
          onlineClients.push(client);
        }
      });

      let msg = `Users list count: ${onlineClients.length}`;
      let delay = 3000;

      this.NotificationService.show({
        message: msg,
        hideDelay: delay
      });


      // checkForUpdates(data.onlineUsers);

      console.log('Angular broadcast event: update:networkUsers');
      this.$rootScope.$broadcast('update:networkUsers', {onlineUsers: data.onlineUsers});

    });

    //normalize notebooks when data changes
    this.socketService.on('normalize:notebooks', (data) => {
      console.log('Heard : normalize:notebooks in app.service', data);

      this.$rootScope.$broadcast('normalize:notebooks', data)

    });

    //when external-client disconnects
    this.socketService.on('userDisconnected', (data) => {
      console.log('$broadcast : update:networkUsers:disconnect');
      this.$rootScope.$broadcast('update:networkUsers:disconnect', data)
    });

    //when external-client makes changes
    this.socketService.on('notify:externalChanges', (data) => {
      console.log('Heard : notify:externalChanges in app.service', data);
      let msg = `Data synced with ${data.connection._id}`;
      let delay = 3000;

      this.NotificationService.show({
        message: msg,
        hideDelay: delay
      });

      // console.log('$broadCast event update:connection');
      // $rootScope.$broadcast('update:connection', data.connection);
      console.log('$broadCast event update:externalData');
      this.$rootScope.$broadcast('update:externalData', data);
    });

    this.socketService.on('update:external-client', (data) => {
      console.log("Heard : update:external-client in app.service");

      let msg = `User ${data.createdBy._id}`;
      let delay = 3000;

      this.NotificationService.show({
        message: msg,
        hideDelay: delay
      });

      console.log('$broadCast event update:externalData');
      this.$rootScope.$broadcast('update:externalData', {updatedData: data});
    });

    //update dynamic data that connection may update manually
    this.socketService.on('update:connectionInfo', (data) => {

      console.log('update:connectionInfo', data);

      this.$rootScope.$broadcast('update:connection', data);

    });

    //update connection
    this.socketService.on('update:connection', (data) => {
      this.$rootScope.$broadcast('update:connection', data);
    });

    //Listen for connections list
    //broadcast all connections to controllers that display connections
    this.socketService.on('send:connections', (data) => {
      this.$rootScope.$broadcast('update:connections', data);
    });

    //TODO: currently we do not use consider using socket vs http
    this.socketService.on('import:project', (data) => {
      alert('importing project....');
    });

  }

  //   ipcImportProject(event, message) {
  //   var options = {
  //     filters: [{ name: 'Glossa File (.glossa)', extensions: ['glossa'] }]
  //   };
  //
  //   dialog.showOpenDialog(options, function(selectedFiles) {
  //
  //       if (selectedFiles) {
  //
  //         $http.post('/api/project/import', {projectPath: selectedFiles[0]})
  //           .then(function successCallback(response) {
  //             $window.location.reload();
  //           }, function errorCallback(response) {
  //             console.log('There was an error', response);
  //             $window.location.reload();
  //           });
  //       }
  //     }
  //   );
  // }
  //
  //   ipcChangeState(event, state) {
  //   $state.go(state, {});
  // }
}
