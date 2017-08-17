import Mousetrap from 'mousetrap';
//@electron-run
var ipc = window.require('electron').ipcRenderer;
var dialog = window.require('electron').remote.dialog;

export class RootService {
  constructor($http, $rootScope, $state, $window, NotificationService, Upload, cfpLoadingBar, IpcSerivce, __appData) {
    'ngInject';

    this.$http = $http;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.$window = $window;
    this.NotificationService = NotificationService;
    this.Upload = Upload;
    this.cfpLoadingBar = cfpLoadingBar;
    this.ipcSerivce = IpcSerivce;
    this.__appData = __appData;

    //TODO: move ipc listeners to their own service
    //@electron-run
    ipc.on('navigateToState', this.navigateToState.bind(this));


    ipc.on('reloadCurrentState', this.reloadCurrentState.bind(this));


    //this overwrites events even if input/codemirror/simplemde is focused...
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
    Mousetrap.bind(['command+right'], () => {
      this.$rootScope.$broadcast('scrubRight');
      return false
    });
    Mousetrap.bind(['command+left'], () => {
      this.$rootScope.$broadcast('scrubLeft');
      return false
    });
    Mousetrap.bind(['command+t', 'ctrl+t'], () => {
      this.$rootScope.$broadcast('addTimeStamp');
      return false
    });
    Mousetrap.bind(['command+up'], () => {
      this.$rootScope.$broadcast('adjustPlaySpeedUp');
      return false
    });
    Mousetrap.bind(['command+down'], () => {
      this.$rootScope.$broadcast('adjustPlaySpeedDown');
      return false
    });
    Mousetrap.bind(['command+space', 'ctrl+space'], () => {
      this.$rootScope.$broadcast('playPause');
      return false
    });
    Mousetrap.bind(['command+1', 'ctrl+1'], () => {
      this.$state.go('corpus');
      return false
    });
    Mousetrap.bind(['command+2', 'ctrl+2'], () => {
      this.$state.go('notebook');
      return false
    });
  }


  //electron event
  ipcImportProject(event, message) {
    console.log('ipcImportProject');
    return new Promise((resolve, reject) => {
      console.log('test1');
      let options = {
        filters: [{name: 'Glossa File (.glossa)', extensions: ['glossa']}]
      };

      return dialog.showOpenDialog(options, (selectedFiles) => {
        console.log('showOpenDialog');
          if (selectedFiles) {
            console.log('file was selected');
            this.$http.post('/api/project/import', {projectPath: selectedFiles[0]})
              .then((response) => {
                console.log('response was success');
                this.$window.location.reload();
                resolve(response);
              })
              .catch((err) => {

                console.log('There was an error', err);
                this.$window.location.reload();
                reject(err);
              });
          } else {
            console.log('no file selected');
            resolve('Nothing selected');
          }
        }
      );
    });
  }


  updateSettings(settings) {
    return this.$http.put(`/api/settings/${this.__appData.initialState.user._id}`, settings)
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
    return this.$http.put(`/api/user/${this.__appData.initialState.user._id}/session`, session)
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
    console.log('user api called from getUser');
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
    console.log('user api called from getSettings');
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

  removeAvatar(file) {
    console.log('file', file);
    return this.$http.put(`/api/user/${this.__appData.initialState.user._id}/avatar`, {filePath: file.absolutePath})
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  saveSettings(settings) {
    return this.$http.put(`/api/settings/${this.__appData.initialState.user._id}`, settings)
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
    return this.$http.put(`/api/user/${this.__appData.initialState.user._id}/`, user)
      .then((response) => {

        this.ipcSerivce.send('broadcast:profile-updates');

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
    console.log("user: ", user);
    //we convert to json so we don't deal with angualar's hashing system
    this.ipcSerivce.send('update:following', {user:  angular.toJson(user)})
  }


  //TODO: refractor
  //broadcast updates to users that follow
  broadcastUpdates(data) {
    this.ipcSerivce.send('broadcast:Updates', data);
  }

}
