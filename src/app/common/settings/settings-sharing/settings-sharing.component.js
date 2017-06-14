import templateUrl from './settings-sharing.html';

export const settingsSharingComponent = {
  bindings: {
    settings: '<',
    allConnections: '<',
    onlineConnections: '<',
    currentUser: '<',
    pageTitle: '<',
    onRemoveAvatar: '&',
    onUploadAvatar: '&',
    onUpdateUserInfo: '&',
    onToggleSharing: '&',
    onToggleFollow: '&',
  },
  templateUrl,
  controller: class SettingsSharingComponent {
    constructor($q, RootService, SocketService, DialogService, cfpLoadingBar) {
      'ngInject';

      this.$q = $q;
      this.rootService = RootService;
      this.socketService = SocketService;
      this.dialogService = DialogService;
      this.cfpLoadingBar = cfpLoadingBar;

      // this.$scope.$on('update:networkUsers', this.updateNetworkUsers.bind(this));
      // this.$scope.$on('update:networkUsers:disconnect', this.updateNetworkUsersDisconnect.bind(this));
      // this.$scope.$on('update:connection', this.updateConnection.bind(this));
      // this.$scope.$on('update:connections', this.updateConnections.bind(this));

    }

    $onChanges(changes) {
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
      // if (changes.currentUser) {
      //   console.log('changes with currentUser')
      //   this.currentUser = angular.copy(changes.currentUser.currentValue);
      // }
    }

    $onInit() {

    }

    removeAvatar(path) {
      this.onRemoveAvatar({
        $event: {
          path: path
        }
      });
    }

    uploadAvatar(file) {
      this.onUploadAvatar({
        $event: {
          file: file
        }
      });
    }

    updateUserInfo() {
      console.log('this.currentUser',this.currentUser);
      this.onUpdateUserInfo({
        $event: {
          currentUser: this.currentUser
        }
      });


      // this.rootService.updateUserProfile(userProfile)
    }

    toggleSharing() {
      this.onToggleSharing({
        $event: {
          isSharing: this.settings.isSharing
        }
      });
    }

    toggleFollow(event) {

      this.onToggleFollow({
        $event: {
          user: event.user
        }
      });

      // console.log('toggleFollow in settings-sharing.componenetjs');
      // event.user.following = !event.user.following;
      // this.rootService.toggleFollow(event.user);
    }
  }
};