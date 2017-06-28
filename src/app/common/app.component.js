import templateUrl from './app.html';

export const appComponent = {
  bindings: {
    allConnections: '<',
    commonTags: '<',
    currentUser: '<',
    hashtags: '<',
    notebooks: '<',
    project: '<',
    settings: '<',
  },
  templateUrl,
  controller: class AppComponent {
    constructor($scope, $state, $q, $mdDialog, cfpLoadingBar, RootService, NotificationService, SettingsService, DialogService, __appData, NotebookService) {
      'ngInject';
      console.log('AppComponent loaded............');
      this.$scope = $scope;
      this.$state = $state;
      this.$q = $q;
      this.cfpLoadingBar = cfpLoadingBar;
      this.$mdDialog = $mdDialog;
      this.notebookService = NotebookService;

      this.__appData = __appData;

      this.rootService = RootService;
      this.notificationService = NotificationService;
      this.settingsService = SettingsService;
      this.dialogService = DialogService;
      this.$scope.$on('update:connections', this.updateConnections.bind(this));
      this.$scope.$on('update:connection', this.updateConnection.bind(this));
    }

    $onChanges(changes) {
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.notebooks) {
        this.notebooks = angular.copy(changes.notebooks.currentValue);
      }
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
      if (changes.project) {
        this.project = angular.copy(changes.project.currentValue);
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue);
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
    }

    $onInit() {
      // this.currentUser = this.rootService.getUser();
      // this.project = this.settingsService.getProject();
      // this.allConnections = this.rootService.getConnections();
      // this.hashtags = this.rootService.getHashtags();
      // this.commonTags = this.rootService.getCommonHashtags();
    }

    ////////////
    //Settings//
    ////////////

    saveMediaSettings(event) {
      this.rootService.saveSettings(event.settings)
        .then((data) => {
          this.settings = angular.copy(this.__appData.initialState.settings);
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
          this.project = angular.copy(this.__appData.initialState.project);
          // this.project = angular.copy(data);
          this.cfpLoadingBar.complete();
        })
    }

    updloadAvatar(event) {
      this.cfpLoadingBar.start();
      this.$q.when(this.rootService.uploadAvatar(event.file))
        .then((data) => {
          this.currentUser = angular.copy(this.__appData.initialState.user);
          this.notebooks = angular.copy(this.__appData.initialState.notebooks);
          // this.currentUser = angular.copy(data);
          // this.settings = this.currentUser.settings;
          this.cfpLoadingBar.complete();
        });
    }

    removeAvatar(event) {
      this.cfpLoadingBar.start();
      this.rootService.removeAvatar(event.file)
        .then((data) => {
          console.log('data returned from avatar removal', data);
          this.currentUser = angular.copy(this.__appData.initialState.user);
          this.notebooks = angular.copy(this.__appData.initialState.notebooks);
          // this.currentUser = angular.copy(data);
          // this.settings = this.currentUser.settings;
        })
    }

    //update 'profile' information.
    updateUserInfo(event) {
      this.cfpLoadingBar.start();
      //http request
      this.rootService.updateUserInfo(event.currentUser)
        .then((data) => {
          //copy new user data to update across application
          this.currentUser = angular.copy(this.__appData.initialState.user); //copy data to ensure $onchnages triggered across application
          //copy new notebook data to update across application
          this.notebooks = angular.copy(this.__appData.initialState.notebooks);
          this.cfpLoadingBar.complete();
          console.log('TODO: emit to external socket that user data has been updated?????? or bradcast when db is updated.....  ');
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

    //TODO: remove dialog service and just create it here for simplicity
    confirmToggleSharing(event) {
      let options = {};
      if (this.settings.isSharing) {
        options.title = 'Are you sure you want to turn OFF sharing?';
        options.textContent = 'By clicking yes, you will not be able to sync data with other users...';
      } else {
        options.title = 'Are you sure you want to turn ON sharing?';
        options.textContent = 'By clicking yes, you will automatically sync data with other users...';
      }

      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            console.log(result);
            //trigger changes back down the child components
            this.settings = angular.copy(this.settings)
          } else {
            //this updates the persisted data and the global.initialState object
            this.rootService.updateSettings({isSharing: event.isSharing})
              .then((data) => {
                //data should be the correct object (unless there are errors), however, for consistency sake, becuase __appData is electron global object that we update with the put request on the api server, we can set it to the __appData object as we do in the resolve of the app route
                //this ensures all our data is normalized for each session and persisted over multiple sessions and at each moment.
                //essential our one source of truth will be from __appData which will be updated through express.
                //this should be done with all api calls
                //TODO: update all api routes to update global appData object
                //TODO: update all setting of objects to reference global appData object
                //on this copy specifically, it updates all child components twice, I belive this is because of md-switch's internal state
                this.settings = angular.copy(this.__appData.initialState.settings);
                this.rootService.toggleSharing(this.settings.isSharing)


              })
          }
        })
    }

    updateConnections(event, data) {
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
      });

      tempArr.forEach((n) => {
        this.allConnections.push(n);
        if (n.following && n.online) {
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

    saveNotebook(event) {
      this.$mdDialog.hide();
      this.cfpLoadingBar.start();
      event.notebook.createdBy = {
        _id: this.currentUser._id,
        avatar: this.currentUser.avatar || null,
        name: this.currentUser.name
      };
      event.notebook.projectId = this.project._id;

      this.notebookService.createNotebook(event.notebook)
        .then((data) => {
          this.notebooks = angular.copy(this.__appData.initialState.notebooks);
          this.cfpLoadingBar.complete();
        })
        .catch((data) => {
          console.log('There was an error ', data);
          this.cfpLoadingBar.complete();
        });
    }


    //////////
    //Global//
    //////////

    searchSubmit(event) {
      this.searchText = event.searchText;
    }

    clearSearch(event) {
      this.searchText = angular.copy(event.text);
    }


    //need to sort//
    ///////////////

    updateTag(event) {
      this.rootService.updateTag(event.tag)
        .then((data) => {
          this.hashtags.map((tag, index) => {
            if (tag._id === data._id) {
              this.hashtags[index] = data;
            }
          });
        })
    }

  },
};
