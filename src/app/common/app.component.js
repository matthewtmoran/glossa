import templateUrl from './app.html';

export const appComponent = {
  bindings: {
    currentUser: '<',
    project: '<',
    allConnections: '<',
    hashtags: '<',
    commonTags: '<'
  },
  templateUrl,
  controller: class AppComponent {
    constructor($scope, $state, $q, cfpLoadingBar, RootService, NotificationService, SettingsService, DialogService) {
      'ngInject';
      console.log('AppComponent loaded............');
      this.$scope = $scope;
      this.$state = $state;
      this.$q = $q;
      this.cfpLoadingBar = cfpLoadingBar;

      this.rootService = RootService;
      this.notificationService = NotificationService;
      this.settingsService = SettingsService;
      this.dialogService = DialogService;
      this.settings = {};
      this.$scope.$on('update:connections', this.updateConnections.bind(this));
      this.$scope.$on('update:connection', this.updateConnection.bind(this));

    }

    $onChanges(changes) {
      console.log('$onChanges in app.component', changes);
      if (changes.allConnections) {
        console.log('changes in allConnections');
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
        this.settings = angular.copy(this.currentUser.settings);
      }
      if (changes.project) {
        this.project = angular.copy(changes.project.currentValue);
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue);
      }
    }


    $onInit() {
      console.log('$onInit in app.component');
    }


    //comes from settings.component

    saveMediaSettings(event) {
      this.rootService.saveSettings(event.settings)
        .then((data) => {
          console.log('data', data);
          this.settings = angular.copy(data.settings);
        })
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
          this.settingsService.exportProject(event.project)
            .then((data) => {
              this.cfpLoadingBar.complete();
            });
        });
    }

    updateProject(event) {
      this.cfpLoadingBar.start();
      this.settingsService.updateProject(event.project)
        .then((data) => {
          this.project = angular.copy(data);

          console.log('TODO: update project name in drawer in rt......');
          // drawerMenu.updateProjectName(vm.project.name);
          this.cfpLoadingBar.complete();
        })
    }


    /**
     * called when a single connection is updated
     * angular event listener
     * called from socket event
     * @param event = angular event object
     * @param data = {connection: object}
     */
    updateConnection(event, data) {
      console.log('ng-on:: update:connection', data);

      let doesExist = false;
      //connection should already exist in array
      this.allConnections.map((connection, index) => {
        if (connection._id === data.connection._id) {
          doesExist = true;
          this.allConnections[index] = data.connection;
        }
      });

      if (!doesExist) {
        console.log('is a new connection coming online?');
        this.allConnections.push(data.connection)
      }

      //copy to trigger changes
      this.allConnections = angular.copy(this.allConnections);

    }


    updloadAvatar(event) {
      this.cfpLoadingBar.start();
      this.$q.when(this.rootService.uploadAvatar(event.file))
        .then((data) => {
          this.currentUser = angular.copy(data);
          this.settings = this.currentUser.settings;
          this.cfpLoadingBar.complete();
        });
    }

    //update 'profile' information.
    updateUserInfo(event) {
      this.cfpLoadingBar.start();
      //http request
      this.rootService.updateUserInfo(event.currentUser)
        .then((data) => {
          this.currentUser = angular.copy(data); //copy data to ensure $onchnages triggered across application
          this.settings = this.currentUser.settings;
          this.cfpLoadingBar.complete();
          console.log('TODO: emit to external socket that user data has been updated?????? or bradcast when db is updated.....  ');
        })
    }

    removeAvatar(event) {
      this.cfpLoadingBar.start();
      this.rootService.removeAvatar(event.file)
        .then((data) => {
          console.log('data returned from avatar removal', data);
          this.currentUser = angular.copy(data);
          this.settings = this.currentUser.settings;
        })
    }


    toggleSharing(event) {
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
          console.log('TODO: refractor how settigns work');
          this.rootService.saveSettings(this.settings)
            .then((data) => {
              console.log('TODO: this is where settings should vbe update across application', data);
            })
        })
    }


    updateConnections(event, data) {

      console.log('');
      console.log('*** updateConnections ', data);


      console.log('this.allConnections', this.allConnections);
      //remove users from data that are not online and we are not following
      this.allConnections.map((existing, index) => {
        let stillExists = false; //flag to false
        data.connections.forEach((con, i) => { //check new data array for the existing
          if (existing._id === con._id) {
            this.allConnections[index] = con; //update the existing record with the most up-to-date record
            stillExists = true; //if there is a match the it exists
          }
        });
        //if it doesnt exist and we ar not following, remove it.
        if (!stillExists && !existing.following) {
          this.allConnections.splice(this.allConnections.indexOf(existing), 1)
        }
      });

      console.log('removed offline non-followed users');
      console.log('this.allConnections', this.allConnections);

      let tempArr = [];
      data.connections.forEach((potential) => {

        let doesExist = false;

        this.allConnections.forEach((cur) => {
          if (potential._id === cur._id) {
            doesExist = true;
          }
        });

        if (!doesExist) {
          tempArr.push(potential);
        }



        // if (this.allConnections.indexOf(potential) < 0) {
        //   console.log('this connection does not exist in the allConnections array');
        //   this.allConnections.push(potential);
        //
        //   if (potential.following && potential.online) {
        //     console.log('we are following this connection. ');
        //     console.log('TODO: notify user connection has come online');
        //     let msg = `${potential.name} is online.`;
        //     let delay = 3000;
        //     this.notificationService.show({
        //       message: msg,
        //       hideDelay: delay
        //     });
        //   }
        // }
      });


      tempArr.forEach((n) => {
        this.allConnections.push(n);
        if (n.following && n.online) {
          console.log('we are following this connection. ');
          console.log('TODO: notify user connection has come online');
          let msg = `${n.name} is online.`;
          let delay = 3000;
          this.notificationService.show({
            message: msg,
            hideDelay: delay
          });
        }
      });

      tempArr = [];

      this.allConnections = angular.copy(this.allConnections);


    }


    updateTag(event) {
      this.rootService.updateTag(event.tag)
        .then((data) => {
          this.hashtags.map((tag, index) => {
            if (tag._id === data._id) {
              this.hashtags[index] = data;
            }
          });
          console.log('DOES THIS UPDATE TRIGGET HASHTAG CHANGES?????????');
          // this.hashtags = angular.copy(this.hashtags);

        })

    }


    searchSubmit(event) {
      this.searchText = event.searchText;
    }

    clearSearch(event) {
      console.log('clearSearch', event);
      this.searchText = angular.copy(event.text);
    }

  },
};
