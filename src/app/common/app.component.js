import SimpleMDE from 'simplemde';
import templateUrl from './app.html';
import NotebookNormalTemplate from './notebook/notebook-dialog/notebook-dialog-normal.html';
import NotebookPreviewTemplate from './notebook/notebook-dialog/notebook-dialog-preview.html';
import NotebookImageTemplate from './notebook/notebook-dialog/notebook-dialog-image.html';
import NotebookAudioTemplate from './notebook/notebook-dialog/notebook-dialog-audio.html';
import { NotebookDialogController } from './notebook/notebook-dialog/notebook-dialog-controller';

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
    constructor($scope, $state, $q, $mdDialog, cfpLoadingBar, RootService, NotificationService, SettingsService, DialogService, __appData, NotebookService, IpcSerivce) {
      'ngInject';
      console.log('AppComponent loaded............');
      this.$scope = $scope;
      this.$state = $state;
      this.$q = $q;
      this.cfpLoadingBar = cfpLoadingBar;
      this.$mdDialog = $mdDialog;
      this.notebookService = NotebookService;
      this.ipcSerivce = IpcSerivce;

      this.__appData = __appData;

      this.rootService = RootService;
      this.notificationService = NotificationService;
      this.settingsService = SettingsService;
      this.dialogService = DialogService;
      this.$scope.$on('update:connections', this.updateConnections.bind(this));
      this.$scope.$on('update:connection', this.updateConnection.bind(this));

      this.$scope.$on('normalize:notebooks', this.normalizeNnotebooks.bind(this));
      this.$scope.$on('update:externalData', this.updateExternalData.bind(this));

      //broadcasted from hot-key event
      this.$scope.$on('newNotebook', this.viewNotebookDetails.bind(this));



      this.ipcSerivce.on('update-connection-list', (event, data) => {

        console.log('on:: update-connection-list');

        this.allConnections = angular.copy(this.__appData.initialState.connections);

        console.log('this.allConnections', this.allConnections);

      });

      this.ipcSerivce.on('update-synced-notebooks', (event, data) => {

        console.log('on:: update-synced-notebooks');

        console.log('TODO: probably need to use map to update the new ones with a "new" flag');


        this.notebooks = angular.copy(this.__appData.initialState.notebooks);

        console.log('this.notebooks', this.notebooks);

      });

      this.ipcSerivce.on('sync-event-start', (event, data) => {

        console.log('on:: sync-event-start');
        this.cfpLoadingBar.start();

        let msg = `Syncing Data`;
        let delay = 3000;
        let action = 'Dismiss';

        this.notificationService.show({
          message: msg,
          hideDelay: delay,
          action: action
        });



      });

      this.ipcSerivce.on('sync-event-end', (event, data) => {
        console.log('on:: sync-event-end');
        this.cfpLoadingBar.complete();
      });

    }

    $onChanges(changes) {
      if (changes.allConnections) {
        console.log('changes with allConnections in app.component', changes);
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

      this.simplemdeToolbar = [
        {
          name: "italic",
          action: SimpleMDE.toggleItalic,
          className: "md-icon-button toolbar-icon md-button md-ink-ripple",
          iconClass: 'format_italic',
          title: "Italic",
        },
        {
          name: "bold",
          action: SimpleMDE.toggleBold,
          className: "md-icon-button toolbar-icon md-button md-ink-ripple",
          iconClass: "format_bold",
          title: "Bold",
        },
        {
          name: "header",
          action: SimpleMDE.toggleHeading1,
          className: "md-icon-button material-icons toolbar-icon md-button md-ink-ripple",
          iconClass: "text_fields",
          title: "Header",
        },
        "|", // Separator
        {
          name: "Blockquote",
          action: SimpleMDE.toggleBlockquote,
          className: "md-icon-button toolbar-icon md-button md-ink-ripple",
          iconClass: "format_quote",
          title: "Blockquote",
        },
        {
          name: "Bullet List",
          action: SimpleMDE.toggleUnorderedList,
          className: "md-icon-button toolbar-icon md-button md-ink-ripple",
          iconClass: "format_list_bulleted",
          title: "Bullet List",
        },
        {
          name: "Ordered List",
          action: SimpleMDE.toggleOrderedList,
          className: "md-icon-button toolbar-icon md-button md-ink-ripple",
          iconClass: 'format_list_numbered',
          title: "Numbered List",
        },
        "|",
        {
          name: "Toggle Preview",
          action: SimpleMDE.togglePreview,
          className: "md-icon-button toolbar-icon md-button md-ink-ripple",
          iconClass: 'visibility',
          title: "Toggle Preview",
        }
      ];
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

    //follow an online user
    toggleFollow(event) {
      this.rootService.toggleFollow(event.user);
    }


    ////////////
    //Notebook//
    ////////////



    //new notebook
    saveNotebook(event) {
      console.log('this', this);
      console.log('this.notebooks on saveNotebook', this.notebooks);
      console.log('event.notebook', event.notebook);
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
        console.log('this', this);
        console.log('createNotebook resolved... ');
        console.log('this.notebooks.length', this.notebooks.length);
          this.notebooks = angular.copy(this.__appData.initialState.notebooks);
        console.log('this.notebooks.length', this.notebooks.length);
          this.cfpLoadingBar.complete();
        })
        .catch((data) => {
          console.log('There was an error ', data);
          this.cfpLoadingBar.complete();
        });
    }

    // update notebook
    updateNotebook(event) {
      console.log('update event');
      this.cfpLoadingBar.start();
      this.notebookService.updateNotebook(event.notebook)
        .then((data) => {
          this.$mdDialog.hide();

          this.notebooks = angular.copy(this.__appData.initialState.notebooks);

          // this.notebooks.map((notebook, index) => {
          //   if (notebook._id === data._id) {
          //     this.notebooks[index] = data;
          //   }
          // });
          this.cfpLoadingBar.complete();
        })
    }

    //remove notebook
    deleteNotebook(event) {
      let options = {
        title: "Are you sure you want to delete this post?",
        textContent: "By deleting this post... it wont be here anymore..."
      };

      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            this.viewDetails(event);
          } else {
            this.cfpLoadingBar.start();
            this.notebookService.deleteNotebook(event.notebook)
              .then((data) => {
                if(!data) {
                  return;
                }
                if (data) {

                  this.notebooks = angular.copy(this.__appData.initialState.notebooks);

                  this.cfpLoadingBar.complete();
                }
              });
          }
        })
    }

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

    //view notebook details
    viewNotebookDetails(event) {

      if (!event.notebook) {
        event.notebook = {
          postType: event.type || 'normal'
        }
      }

      let state = {};

      switch(event.notebook.postType) {
        case 'image':
          this.editorOptions = {
            toolbar: false,
            status: false,
            spellChecker: false,
            autoDownloadFontAwesome: false,
            placeholder: 'Image caption...',
          };
          state = {
            templateUrl: NotebookImageTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            controller: NotebookDialogController,
            controllerAs: '$ctrl',
            bindToController: true,
            locals: {
              settings: this.settings,
              hashtags: this.hashtags,
              notebook: event.notebook || {},
              editorOptions: this.editorOptions,
              onCancel: this.cancel.bind(this),
              onDeleteNotebook: this.deleteNotebook.bind(this),
              onHide: this.hide.bind(this),
              onUpdate: this.updateNotebook.bind(this),
              onSave: this.saveNotebook.bind(this)
            }
          };

          break;
        case 'audio':
          this.notebook = event.notebook;
          this.editorOptions = {
            toolbar: false,
            status: false,
            spellChecker: false,
            autoDownloadFontAwesome: false,
            placeholder: 'Audio caption...',
          };
          state = {
            templateUrl: NotebookAudioTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            controller: NotebookDialogController,
            controllerAs: '$ctrl',
            bindToController: true,
            locals: {
              settings: this.settings,
              hashtags: this.hashtags,
              notebook: event.notebook || {},
              editorOptions: this.editorOptions,
              onCancel: this.cancel.bind(this),
              onDeleteNotebook: this.deleteNotebook.bind(this),
              onHide: this.hide.bind(this),
              onUpdate: this.updateNotebook.bind(this),
              onSave: this.saveNotebook.bind(this)
            }
          };
          break;
        case 'normal':
          this.notebook = event.notebook;
          this.editorOptions = {
            toolbar: this.simplemdeToolbar,
            spellChecker: false,
            status: false,
            forceSync: true,
            autoDownloadFontAwesome: false,
            placeholder: 'Post description...',
          };

          state = {
            templateUrl: NotebookNormalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            controller: NotebookDialogController,
            controllerAs: '$ctrl',
            bindToController: true,
            locals: {
              settings: this.settings,
              hashtags: this.hashtags,
              notebook: event.notebook || {},
              editorOptions: this.editorOptions,
              onCancel: this.cancel.bind(this),
              onDeleteNotebook: this.deleteNotebook.bind(this),
              onHide: this.hide.bind(this),
              onUpdate: this.updateNotebook.bind(this),
              onSave: this.saveNotebook.bind(this)
            }
          };

          break;
        case 'default':
          console.log('error');
      }

      this.$mdDialog.show(state)
        .then((data) => {
          return data;
        })
        .catch((data) => {
          return data;
        });
    }

    //manage hashtags with dialog at notebooks
    tagManaageDialog() {
      this.$mdDialog.show({
        controller: () => this,
        controllerAs: '$ctrl',
        template: `<md-dialog class="hashtag-dialog" flex-xs="90" flex-sm="80" flex-gt-sm="80">
                        <md-content>
                            <settings-hashtags on-update-tag="$ctrl.updateTag($event)" hashtags="$ctrl.hashtags"></settings-hashtags>
                        </md-content>
                        <span flex></span>
                        <md-dialog-actions>
                            <md-button ng-click="$ctrl.cancel()">Close</md-button>
                        </md-dialog-actions>
                  </md-dialog>`,
        // templateUrl: 'app/tagManagement/hashtags.dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        // bindToController: true,
      }).then((data) => {
        return data;
      }).catch((data) => {
        return data;
      })
    }

    //TODO: refractor to use global object
    showNewNotebookUpdates() {
      console.log('TODO: NEED TO REFRACTOR');
      console.log('TODO: Refractor this function!!!!!!!!!!!!!!!!!!!!!!!!!!1');
      this.externalNotebooks.forEach((newNotebook) => {
        newNotebook.isNew = true;
        if (this.notebooks.indexOf(newNotebook) < 0) {
          this.notebooks.push(newNotebook);
        }
      });
      this.externalNotebooks = [];
    }



    //I believe this is called when connection connect and the data changes.
    //TODO: refractor to use global object
    normalizeNnotebooks(event, data) {
      console.log('TODO: NEED TO REFRACTOR');
      console.log('TODO: Refractor this function!!!!!!!!!!!!!!!!!!!!!!!!!!1');
      this.notebooks.forEach((notebook) => {
        if (notebook.createdBy._id === data._id) {
          notebook.createdBy.name = data.name;
          notebook.createdBy.avatar = data.avatar;
        }
      })
    }

    //TODO: refractor to use global object
    updateExternalData(event, data) {
      console.log('TODO: NEED TO REFRACTOR');
      console.log('TODO: Refractor this function!!!!!!!!!!!!!!!!!!!!!!!!!!1');

      if (Array.isArray(data.updatedData)) {

        data.updatedData.forEach((notebook) => {

          let isUpdate = false;

          for(let i = 0, len = this.notebooks.length; i < len; i++) {
            if (this.notebooks[i]._id === notebook._id) {
              isUpdate = true;
              this.notebooks[i] = notebook;
              console.log("TODO: give user notification update was made.... ")
            }
          }
          if (!isUpdate) {

            let exists = false;
            this.externalNotebooks.forEach((exNb) => {
              if (exNb._id === notebook._id) {
                exists = true;
              }
            });

            if (!exists) {
              this.externalNotebooks.push(notebook);
            }

          }
        })
      } else {

        let isUpdate = false;
        for(let i = 0, len = this.notebooks.length; i < len; i++) {
          if (this.notebooks[i]._id === data.updatedData._id) {
            isUpdate = true;
            this.notebooks[i] = data.updatedData;
            console.log("TODO: give user notification update was made.... ")
          }
        }

        if (!isUpdate) {
          this.externalNotebooks.push(data.updatedData);
        }
      }
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


    cancel() {
      this.$mdDialog.cancel();
    }

    hide() {
      this.$mdDialog.hide();
    }

  },
};
