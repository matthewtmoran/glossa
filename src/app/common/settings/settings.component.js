import templateUrl from './settings.html';

export const settingsComponent = {
  bindings: {
    project: '<',
    settings: '<',
    currentUser: '<',
    allConnections: '<',
    onlineConnections: '<',
    previousState: '<',
    hashtags: '<',
    onUpdateProject: '&',
    onExportProject: '&',
    onSaveMediaSettings: '&',
    onUploadAvatar: '&',
    onUpdateUserInfo: '&',
    onRemoveAvatar: '&',
    onUpdateTag: '&',
    onConfirmToggleSharing:'&',
    onToggleFollow: '&'
  },
  templateUrl,
  controller: class SettingsComponent {
    constructor($scope, $state, $q, RootService, SettingsService, cfpLoadingBar, DialogService) {
      'ngInject';

      this.$scope = $scope;
      this.$state = $state;
      this.$q = $q;

      this.rootService = RootService;
      this.settingsService = SettingsService;
      this.dialogService = DialogService;
      this.cfpLoadingBar = cfpLoadingBar;
      this.hideNav = true;

      this.$scope.$watch(() => this.selectedTab.index, this.selectedIndexWatch.bind(this));
    }


    $onChanges(changes) {
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
      if (changes.project) {
        this.project = angular.copy(changes.project.currentValue);
      }
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue);
      }
    }


    $onInit() {
      this.tabs = [
        {
          label: 'Project',
          state: 'project',
          index: 0
        },
        {
          label: 'Media',
          state: 'media',
          index: 1
        },
        {
          label: 'Sharing',
          state: 'sharing',
          index: 2
        },
        {
          label: 'Hashtags',
          state: 'hashtags',
          index: 3
        },
        {
          label: 'About',
          state: 'about',
          index: 4
        }
      ];
      this.selectedTab = this.tabs.find(tab => tab.state === this.$state.current.name);
    }

    selectedIndexWatch(current, old) {
      switch (current) {
        case 0:
          this.selectedTab = this.tabs[0];
          this.$state.go(this.tabs[0].state);
          break;
        case 1:
          this.selectedTab = this.tabs[1];
          this.$state.go(this.tabs[1].state);
          break;
        case 2:
          this.selectedTab = this.tabs[2];
          this.$state.go(this.tabs[2].state);
          break;
        case 3:
          this.selectedTab = this.tabs[3];
          this.$state.go(this.tabs[3].state);
          break;
        case 4:
          this.selectedTab = this.tabs[4];
          this.$state.go(this.tabs[4].state);
          break;
      }
    }

    back() {
      this.$state.go(this.previousState.Name, this.previousState.Params);
    }

    //passes event up to app.component
    updateProject(event) {
      this.onUpdateProject({
        $event: {
          project: event.project
        }
      });
    }
    //passes event up to app.component
    exportProject(event) {
      this.onExportProject({
        $event: {
          project: event.project
        }
      });
    }
    //passes event up to app.component
    saveMediaSettings(event) {
      this.onSaveMediaSettings({
        $event: {
          settings: event.settings
        }
      });
    }
    //passes event up to app.component
    removeAvatar(event) {
      this.onRemoveAvatar({
        $event: {
          file: event.path
        }
      });
    }
    //passes event up to app.component
    uploadAvatar(event) {
      this.onUploadAvatar({
        $event: {
          file: event.file
        }
      });
    }
    //passes event up to app.component
    updateUserInfo(event) {
      this.onUpdateUserInfo({
        $event: {
          currentUser: event.currentUser
        }
      });
    }
    //passes event up to app.component
    confirmToggleSharing(event) {
      this.onConfirmToggleSharing({
        $event: event
      })
    }

    toggleFollow(event) {
      this.onToggleFollow({
        $event: event
      })
    }

    updateTag(event) {
      this.onUpdateTag({
        $event: {
          tag: event.tag
        }
      })
    }
  }
};