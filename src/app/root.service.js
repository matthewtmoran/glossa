import Mousetrap from 'mousetrap';
//@electron-run
var ipc = window.require('electron').ipcRenderer;
var dialog = window.require('electron').remote.dialog;

export class RootService {
  constructor($http, $rootScope, $state, $window, SocketService, NotificationService, Upload, cfpLoadingBar, IpcSerivce) {
    'ngInject';

    this.$http = $http;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.$window = $window;
    this.socketService = SocketService;
    this.NotificationService = NotificationService;
    this.Upload = Upload;
    this.cfpLoadingBar = cfpLoadingBar;
    this.ipcSerivce = IpcSerivce;
    this.currentOnlineList = [];

    this.$http.get('api/user').then((response) => {
      this.__user = response.data
    });

    //TODO: move ipc listeners to their own service
    //@electron-run
    ipc.on('navigateToState', this.navigateToState.bind(this));
    ipc.on('import:project', this.ipcImportProject.bind(this));
    ipc.on('reloadCurrentState', this.reloadCurrentState.bind(this));

    //this overwrites events even if input/codemirror/siimplemde is focused...
    Mousetrap.prototype.stopCallback = ((e, element, combo) => {

      if (combo ===
        'command+down' ||
        'command+up' ||
        'command+right' ||
        'command+left' ||
        'ctrl+space' ||
        'command+space') {
        e.preventDefault();
      }

    });
    //focus search bar binding
    Mousetrap.bind(['command+l', 'ctrl+l'], () => {
      angular.element('#main-search').focus();
      // return false to prevent default behavior and stop event from bubbling
      return false
    });
    //create new text file or normal notebook...
    Mousetrap.bind(['command+n', 'ctrl+n'], () => {
      if (this.$state.current.parent.indexOf('corpus') > -1) {
        this.$rootScope.$broadcast('newMarkdown');
      }
      if (this.$state.current.name.indexOf('notebook') > -1) {
        this.$rootScope.$broadcast('newNotebook', 'normal');
      }
      return false
    });
    Mousetrap.bind(['command+right', 'ctrl+right'], () => {
      this.$rootScope.$broadcast('scrubRight');
      return false
    });
    Mousetrap.bind(['command+left', 'ctrl+left'], () => {
      this.$rootScope.$broadcast('scrubLeft');
      return false
    });
    Mousetrap.bind(['command+t', 'ctrl+t'], () => {
      this.$rootScope.$broadcast('addTimeStamp');
      return false
    });
    Mousetrap.bind(['command+up', 'ctrl+up'], () => {
      this.$rootScope.$broadcast('adjustPlaySpeedUp');
      return false
    });
    Mousetrap.bind(['command+down', 'ctrl+down'], () => {
      this.$rootScope.$broadcast('adjustPlaySpeedDown');
      return false
    });
    Mousetrap.bind(['command+space', 'ctrl+space'], () => {
      this.$rootScope.$broadcast('playPause');
      return false
    });
  }


  //electron event
  ipcImportProject(event, message) {
    let options = {
      filters: [{name: 'Glossa File (.glossa)', extensions: ['glossa']}]
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

  updateSettings(settings) {
    return this.$http.put(`/api/settings/${this.__user._id}`, settings)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }

  toggleSharing(isSharing) {
    this.ipcSerivce.send('toggle:sharing', {isSharing: isSharing})
  }

  navigateToState(event, data) {
    this.$state.go(data.state, {});
  }

  reloadCurrentState(event) {
    this.$state.reload('app');
  }

  //should only be called on stateChange and on every state change....
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


  //CORE

  //get user object (settings is also extracted from this data)
  getUser() {
    return this.$http.get('/api/user/')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  getUserIpc() {
    console.log('getUserIpc');
    this.ipcSerivce.send('get:user', (data) => {
      console.log('get:userIpc callback', data);
        return data;
      }
    )
  }


  //get project data
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

  getSettings() {
    return this.$http.get('/api/user/')
      .then((response) => {
        return response.data.settings;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  //get hashtags
  getHashtags() {
    return this.$http.get('/api/hashtags/')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  getCommonHashtags() {
    return this.$http.get('/api/hashtags/common/123')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  //SETTINGS

  uploadAvatar(file) {
    return this.Upload.upload({
      url: 'api/user/avatar',
      data: {files: file},
      arrayKey: '',
      headers: {'Content-Type': undefined}
    }).then((resp) => {
      return resp.data;
    }).catch((resp) => {
      console.log('Error status: ' + resp.status);
    });
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
    return this.$http.put(`/api/settings/${this.__user._id}`, settings)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });

  }

  //this api updates the user AND normalizes notebooks.
  updateUserInfo(user) {
    return this.$http.put(`/api/user/${this.__user._id}/`, user)
      .then((response) => {

        this.ipcSerivce.send('broadcast:profile-updates');

        // this.socketService.emit('broadcast:profile-updates');


        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }

  updateUserInfoIpc(user) {
    // this.ipcSerivce
  }

  updateTag(tag) {
    return this.$http.put(`/api/hashtags/${tag._id}/`, tag)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }

  //tunnels event to broadcast across application
  tunnelEvent(name, data) {
    this.$rootScope.$broadcast(name, data);
  }

//TODO: consider deletion
  getConnections() {
    return this.$http.get('/api/connections/')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }


  //TODO: Refractor
  toggleFollow(user) {
    let userString = angular.toJson(user);

    this.ipcSerivce.send('update:following', {connection: userString});

    // this.socketService.emit('update:following', {connection: userString});
  }

//TODO: consider deletion
  getOnlineUsersSE() {
    this.socketFactory.emit('get:networkUsers')
  }


  //TODO: refractor
  //broadcast updates to users that follow
  broadcastUpdates(data) {

    this.ipcSerivce.send('broadcast:Updates', data);


    // this.socketService.emit('broadcast:Updates', data);
  }


  //called when application is bootstrapped
  initListeners() {
    console.log('initListeners');

    // hand shake
    this.socketService.on('request:SocketType', (data) => {
      console.log("Heard 'request:SocketType' in rootService:", data);

      // let msg = 'server requesting socket type... ';
      // let delay = 3000;
      //
      //
      // this.NotificationService.show({
      //   message: msg,
      //   hideDelay: delay
      // });

      // let socketData = {
      //   type: 'local-client',
      //   socketId: data.socketId
      // };

      // console.log('Emitting: return:SocketType');
      // this.socketService.emit('return:SocketType', socketData);

    });

    // handshake success
    this.socketService.on('notify:server-connection', (data) => {
      console.log("Heard 'notify:server-connection' in rootService.data:", data);

      // let msg = 'connected to local server';
      // let delay = 3000;
      //
      // this.NotificationService.show({
      //   message: msg,
      //   hideDelay: delay
      // });

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
      console.log('on:: notify:externalChanges', data);
      // let msg = `Data synced with ${data.connection.name}`;
      // let delay = 3000;
      //
      // this.NotificationService.show({
      //   message: msg,
      //   hideDelay: delay
      // });

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

      this.$rootScope.$broadcast('update:externalData', {updatedData: data});
    });

    //update dynamic data that connection may update manually
    this.socketService.on('update:connectionInfo', (data) => {
      console.log('on:: update:connectionInfo', data);

      console.log('angular broadcast:: update:connection');
      this.$rootScope.$broadcast('update:connection', data);

    });

    //update connection
    this.socketService.on('update:connection', (data) => {
      console.log('on:: update:connection - data');
      console.log('angular event $broadcast:: update:connection');
      this.$rootScope.$broadcast('update:connection', data);
    });

    //Listen for connections list
    //broadcast all connections to controllers that display connections
    //here we track the entire user list and add or remove users ids from an array.
    this.socketService.on('send:connections', (data) => {
      console.log('on:: send:connections');
      console.log('$broadcast:: update:connections');
      this.$rootScope.$broadcast('update:connections', data);
    });

    //TODO: currently we do not use consider using socket vs http
    this.socketService.on('import:project', (data) => {
      alert('importing project....');
    });

    /////////////////
    //Newer Methods//
    /////////////////

    /**
     * Socket handshake
     */
    // this.socketService.on('request:socket-type', () => {
    //   console.log('on:: request:socket-type');
    //   console.log('emit:: return:socket-type');
    //   this.socketService.emit('return:socket-type', {type: 'local-client'});
    // });


    this.socketService.on('notify:sync-begin', () => {
      console.log('on:: notify:sync-begin');

      let msg = `Data Syncing`;
      let delay = 3000;

      this.NotificationService.show({
        message: msg,
        hideDelay: delay
      });

      this.cfpLoadingBar.start();
    });

    this.socketService.on('notify:sync-end', () => {
      console.log('on:: notify:sync-end');
      this.cfpLoadingBar.complete();
    })

  }

}
