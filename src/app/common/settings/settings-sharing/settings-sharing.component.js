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
    onConfirmToggleSharing: '&'
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

    }

    $onChanges(changes) {
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.settings) {
        console.log('changes in settings', changes.settings);
        this.settings = angular.copy(changes.settings.currentValue);
      }
    }

    $onInit() {

      // this.allConnections = [
      //   {
      //     online: false,
      //     following: false,
      //     avatar: null,
      //     color: 'blue',
      //     name: 'User 1',
      //     _id: 1
      //   },
      //   {
      //     online: true,
      //     following: true,
      //     avatar: `C:\\htdocs\\development\\sandbox\\glossaES6\\glossa\\server\\data\\image\\Adam-1497979068622.jpg`,
      //     color: 'blue',
      //     name: 'User 1',
      //     _id: 1
      //   }
      // ]
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
      this.onUpdateUserInfo({
        $event: {
          currentUser: this.currentUser
        }
      });


      // this.rootService.updateUserProfile(userProfile)
    }

    toggleSharingConfirmed(event) {
      console.log('toggleSharing change event');
    }

    confirmToggleSharing(event) {
      this.onConfirmToggleSharing({
        $event: {
          isSharing: !this.settings.isSharing
        }
      })
    }

    toggleSharing(event) {
      console.log('toggleSharing click event');
      event.preventDefault();
      event.stopPropagation();






      // this.onToggleSharing({
      //   $event: {
      //     isSharing: this.settings.isSharing
      //   }
      // });
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