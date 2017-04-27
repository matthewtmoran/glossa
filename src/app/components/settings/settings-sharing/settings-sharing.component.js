import templateUrl from './settings-sharing.html';

export const settingsSharingComponent = {
  bindings: {
    settings: '<'
  },
  templateUrl,
  controller: class SettingsSharingComponent {
    constructor($scope, $q, RootService, SocketService, DialogService, cfpLoadingBar) {
      'ngInject';

      this.$scope = $scope;
      this.$q = $q;
      this.rootService = RootService;
      this.socketService = SocketService;
      this.dialogService = DialogService;
      this.cfpLoadingBar = cfpLoadingBar;

      this.$scope.$on('update:networkUsers', this.updateNetworkUsers.bind(this));
      this.$scope.$on('update:networkUsers:disconnect', this.updateNetworkUsersDisconnect.bind(this));
      this.$scope.$on('update:connection', this.updateConnection.bind(this));
      this.$scope.$on('update:connections', this.updateConnections.bind(this));

      this.networkUsers = [];
      
    }

    $onInit() {
      this.networkUsers = [];
      this.userProfile = this.rootService.getUser();
      this.rootService.getConnections();
    }

    removeAvatar(path) {
      this.rootService.removeAvatar(path);
    }

    uploadAvatar(file) {
      this.cfpLoadingBar.start();
      this.$q.when(this.rootService.uploadAvatar(file))
        .then((data) => {
          this.userProfile.avatar = data.avatar;
          this.cfpLoadingBar.complete();
        });
    }

    updateUserProfile(userProfile) {
      this.rootService.updateUserProfile(userProfile)
    }

    toggleSharing() {
      let options = {};
      if (!this.settings.isSharing) {
        options.title = 'Are you sure you want to turn OFF sharing?';
        options.textContent = 'By clicking yes, you will not be able to sync data with other users...';
      } else {
        options.title = 'Are you sure you want to turn ON sharing?';
        options.textContent = 'By clicking yes, you will automatically sync data with other users...';
      }

      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            return;
          }
          if (this.settings.isSharing) {
            this.socketService.init();
            this.rootService.initListeners();
            this.rootService.getOnlineUsersSE();
          }
          if (!this.settings.isSharing) {
            this.socketService.disconnect();
          }
          this.rootService.saveSettings(this.settings);
        })
    }

    updateNetworkUsers(event, data) {
      this.networkUsers = data.onlineUsers;
    }

    updateNetworkUsersDisconnect(event, data) {
      this.networkUsers.splice(this.networkUsers.indexOf(data), 1);
    }
    
    updateConnection(event, data) {
      for(let i = 0, len = this.networkUsers.length; i < len; i++) {
        if (this.networkUsers[i]._id === data.connection._id) {
          this.networkUsers[i] = data.connection;
        }
      }
    }
    
    updateConnections(event, data) {
      this.networkUsers = data.connections;
    }

    toggleFollow(event) {
      console.log('toggleFollow in settings-sharing.componenetjs');
      event.user.following = !event.user.following;
      this.rootService.toggleFollow(event.user);
    }
  }
};