import templateUrl from './settings.html';

export const settingsComponent = {
  bindings: {
    project: '<',
    settings: '<',
    currentUser: '<',
    allConnections: '<',
    onlineConnections: '<',
    previousState: '<',
    onUpdateProject: '&',
    onExportProject: '&',
    onSaveMediaSettings: '&'
  },
  templateUrl,
  controller: class SettingsComponent {
    constructor($scope, $state, RootService, SettingsService, cfpLoadingBar, DialogService) {
      'ngInject';

      this.$scope = $scope;
      this.$state = $state;
      this.rootService = RootService;
      this.settingsService = SettingsService;
      this.dialogService = DialogService;
      this.cfpLoadingBar = cfpLoadingBar;
      this.hideNav = true;

      // this.$scope.$watch(this.$scope.selectedTab, this.selectedIndexWatch);
    }


    $onChanges(changes) {
      console.log('changes in settings.component');
      if (changes.allConnections) {
        console.log('changes with allConnections');
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.settings) {
        console.log('changes with settings');
        this.settings = angular.copy(changes.settings.currentValue);
      }
      if (changes.project) {
        console.log('changes with project');
        this.project = angular.copy(changes.project.currentValue);
      }
      if (changes.currentUser) {
        console.log('changes with currentUser');
        this.currentUser = angular.copy(changes.currentUser.currentValue);
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
    }


    selectedIndexWatch(current, old) {
      console.log('index is changing');
      switch (current) {
        case 0:
          this.selectedTab = this.tabs[0];
          $state.go(this.tabs[0].state);
          // $location.url("/meta");
          break;
        case 1:
          this.selectedTab = this.tabs[1];
          $state.go(this.tabs[1].state);
          // $state.go('settings.about');
          // $location.url("/main.baseline");
          break;
        case 2:
          this.selectedTab = this.tabs[2];
          $state.go(this.tabs[2].state);
          // $location.url("/view3");
          break;
        case 3:
          this.selectedTab = this.tabs[3];
          $state.go(this.tabs[3].state);
          // $location.url("/view3");
          break;
      }
    }


    getDefaultState() {
      this.tabs.forEach((tab, index) => {
        if (tab.state === this.$state.current.name) {
          console.log('match');
          this.selectedTab = tab;
          this.$scope.selectedIndex = index;
        }
      })
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

    removeAvatar(event) {

    }

    uploadAvatar(event) {

    }

    updateUserProfile(event) {

    }

    toggleSharing(event) {

    }

    updateNetworkUsers(event) {

    }

    updateNetworkUsersDisconnect(event) {

    }

    updateConnection(event) {

    }

    updateConnections(event) {

    }

  }
};