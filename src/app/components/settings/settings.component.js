import templateUrl from './settings.html';

export const settingsComponent = {
  bindings: {
    previousState: '<',
    allConnections: '<',
    onlineConnections: '<',
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
          label: 'About',
          state: 'about',
          index: 2
        },
        {
          label: 'Sharing',
          state: 'sharing',
          index: 3
        },
        {
          label: 'Hashtags',
          state: 'hashtags',
          index: 4
        }
      ];
      // this.getDefaultState();
      //get user settings
      this.settings = this.rootService.getSettings();
      this.settingsService.getProject()
        .then((data) => {
          this.project = data;
        });
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

    exportProject(event) {
      this.cfpLoadingBar.start();
      let options = {};
      options.title = "Are you sure you want to export all your project data?";
      options.textContent = "This may take a few minutes...";
      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            return;
          }
          console.log('User is sure export data');

         this.settingsService.exportProject(event.project)
           .then((data) => {
            console.log('export project returned', data);
            this.cfpLoadingBar.complete();
          });
        });
    }

    updateProject(event) {
      this.cfpLoadingBar.start();
      this.settingsService.updateProject(event.project)
        .then((data) => {
        this.project = data;

        console.log('TODO: update project name in drawer in rt......');
        // drawerMenu.updateProjectName(vm.project.name);
          this.cfpLoadingBar.complete();
        })
    }

    saveMediaSettings(event) {
      this.rootService.saveSettings(event.settings)
        .then((data) => {
          this.settings = data.settings;
        })
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