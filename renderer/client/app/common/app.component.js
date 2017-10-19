import SimpleMDE from 'simplemde';
import templateUrl from './app.html';
import NotebookNormalTemplate from './notebook/notebook-dialog/notebook-dialog-normal.html';
import NotebookPreviewTemplate from './notebook/notebook-dialog/notebook-dialog-preview.html';
import NotebookImageTemplate from './notebook/notebook-dialog/notebook-dialog-image.html';
import NotebookAudioTemplate from './notebook/notebook-dialog/notebook-dialog-audio.html';
import {NotebookDialogController} from './notebook/notebook-dialog/notebook-dialog-controller';

export const appComponent = {
  bindings: {
    allConnections: '<',
    transcriptions: '<',
    commonTags: '<',
    currentUser: '<',
    hashtags: '<',
    notebooks: '<',
    project: '<',
    settings: '<',
  },
  templateUrl,
  controller: class AppComponent {
    constructor($scope, $state, $timeout, $q, $mdDialog, cfpLoadingBar, RootService, NotificationService, SettingsService, DialogService, __appData, IpcSerivce, $stateParams) {
      'ngInject';
      this.$scope = $scope;
      this.$state = $state;
      this.$q = $q;
      this.cfpLoadingBar = cfpLoadingBar;
      this.$mdDialog = $mdDialog;
      this.ipcSerivce = IpcSerivce;
      this.$stateParams = $stateParams;
      this.$timeout = $timeout;

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
      //called whne the connection list need to be updated
      this.ipcSerivce.on('update-connection-list', (event, data) => {
        console.log('on:: update-connection-list');

        // this.allConnections = angular.copy(this.__appData.initialState.connections);

        console.log('this.allConnections', this.allConnections);

      });
      //called when notebooks need to be object - usually when external notebook are added
      this.ipcSerivce.on('update-synced-notebooks', (event, data) => {
        console.log('on:: update-synced-notebooks');
        // this.notebooks = angular.copy(this.__appData.initialState.notebooks);
      });
      //called when new external notebooks are made in real-time
      //adds the notebooks to a holding array before they just populate
      this.ipcSerivce.on('update-rt-synced-notebooks', (event, data) => {
        console.log('on:: update-rt-synced-notebooks');
        if (!this.newNotebooks || !this.newNotebooks.length || !data.length) {
          this.newNotebooks = angular.copy(data);
        } else {
          this.newNotebooks = [...this.newNotebooks, ...data];
        }
      });
      //listener for when something is syncing...
      //TODO: consider removal and updateing sync display to be only client side...
      this.ipcSerivce.on('sync-event-start', (event, data) => {
        console.log('on:: sync-event-start');

        console.log('loader begin');
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
      this.ipcSerivce.on('import:project', (event, data) => {
        this.isLoading = true;
        this.rootService.ipcImportProject()
          .then((response) => {
            console.log('response is here:', response);
            this.$timeout(() => {
              this.isLoading = false;
            });
          })
          .catch((err) => {
            console.log("error", err);
          })
      });
      //removes sync-display
      this.ipcSerivce.on('sync-event-end', (event, data) => {
        console.log('on:: sync-event-end');
        console.log('loader end');
        this.cfpLoadingBar.complete();
      });
      this.ipcSerivce.on('export:project', (event, data) => {
        // this.exportProject({project: this.__appData.initialState.project});
      });
      this.ipcSerivce.on('update-transcription-list', (event, data) => {
        console.log('update-transcription-list');
        // this.transcriptions = angular.copy(this.__appData.initialState.transcriptions);
        //if a new file was created, data contains the id of the new file
        if (data && data.selectedFileId) {
          this.selectFile({fileId: data.selectedFileId}); // set the selected file
        } else {
          this.selectInitialFile(); //set to the first file in the list...
        }
        console.log('loader end');
        this.cfpLoadingBar.complete();
      });


      this.ipcSerivce.on('update:synced-notebooks', (event, notebooks) => {
        console.log('IPC EVENT - ON:: update:synced-notebooks');
        let newNotebooks = [];
        notebooks.forEach((notebook) => {
          let exists = false;
          this.notebooks.forEach((nb, index) => {
            if (notebook._id === nb._id) {
              exists = true;
              this.notebooks[index] = notebook;
            }
          });
          if (!exists) {
            newNotebooks.push(notebook);
          }
        });
        this.notebooks = [...newNotebooks, ...this.notebooks];
        this.cfpLoadingBar.complete();
      });

      this.ipcSerivce.on('update:connection', (event, connection) => {
        console.log('IPC EVENT - ON:: update:connection', connection);
        this.allConnections = this.allConnections.map((con) => {
          if (con._id !== connection._id) {
            return con;
          }
          return connection;
        })

      });

      this.ipcSerivce.on('update:synced-notebook', (event, notebook) => {
        console.log('IPC EVENT - ON:: update:synced-notebook', notebook);
        let exists = false;
        this.notebooks = this.notebooks.map((nb) => {
          if (notebook._id === nb._id) {
            exists = true;
            return notebook;
          }
          return nb;
        });
        //it should exist but just in case...
        if (!exists) {
          this.notebooks.push(notebook);
        }
      });

      //only occurs when avatar is returned
      //meant to only update the user so image is displayed
      this.ipcSerivce.on('avatar-returned', (event, connection) => {
        console.log('IPC EVENT - ON:: avatar-returned', connection);
        this.allConnections = this.allConnections.map((con) => {
          return con;
        })
      });

      this.ipcSerivce.on('new:connection', (event, connection) => {
        console.log('IPC EVENT - ON:: new:connection');
        this.allConnections = [connection, ...this.allConnections];
      });

      this.ipcSerivce.on('remove:connection', (event, connection) => {
        console.log('IPC EVENT - ON:: remove:connection', connection);
        this.allConnections = this.allConnections.filter(c => c._id !== connection._id)
      })
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
      if (changes.transcriptions) {
        this.transcriptions = angular.copy(changes.transcriptions.currentValue);
      }
    }

    $onInit() {
      angular.element('.loading-spinner').fadeOut();
      this.selectInitialFile();
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


    //////////
    //Corpus//
    //////////

    //select the initial file from transcriptions
    selectInitialFile() {
      if (this.transcriptions.length < 1) {
        this.selectedFile = null;
        this.notebookAttachment = null;
      } else {
        let latestFile = this.transcriptions.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        this.selectFile({fileId: latestFile[0]._id});
      }
    }
    //select file event for new files and other events
    selectFile(event) {
      //set the selected file
      this.selectedFile = this.transcriptions.find(file => file._id === event.fileId);
      //if there is an attached notebook
      if (this.selectedFile.notebookId) {
        //get the attached notebook data
        this.notebookAttachment = this.notebooks.find(notebook => notebook._id === this.selectedFile.notebookId);
      } else {
        this.notebookAttachment = null;
      }
    }

    createTranscription(event) {
      console.log('loader begin');
      this.cfpLoadingBar.start();
      this.rootService.createTranscription(event, this.currentUser, this.project, this.$stateParams.corpus)
        .then((data) => {
          this.transcriptions = [data, ...this.transcriptions];
          this.selectFile({fileId: data._id});
        })
        .catch((err) => {
          console.log('returned error', err)
        })

    }
    removeTranscription(event) {
      let options = {
        title: 'Are you sure you want to delete this text?',
        textContent: ' ',
        okBtn: 'Yes, Delete',
        cancelBtn: 'No, cancel'
      };
      this.dialogService.confirmDialog(options)
        .then((response) => {
          if (!response) {
            return;
          }
          console.log('loader begin');
          this.cfpLoadingBar.start();

          this.rootService.deleteTranscription(event.fileId)
            .then((data) =>{
              this.transcriptions = this.transcriptions.filter(trans => trans._id !== event.fileId)
              this.selectInitialFile();
            })
            .catch((err)=> {
              console.log('There was an error removing transcirption file', err);
            });
        });
    }
    updateTranscription(event) {
      this.rootService.updateTranscription(event.file)
        .then((data) => {

        console.log('data returning:', data);

          //keep selected file updated
          this.selectedFile = Object.assign({}, data.transcription);
          //update transcriptions
          this.transcriptions = this.transcriptions.map((trans) => {
            if (trans._id !== data.transcription._id) {
              return trans;
            }
            return data.transcription;
          });

          //update notebook attachment
          this.notebookAttachment = this.notebooks.find(notebook => notebook._id === data.transcription.notebookId);

          //if hashtags return update hashtags
          if(data.hashtags) {
            this.hashtags = [...this.hashtags, ...data.hashtags];
          }

          //calculate common hashtags
          this.rootService.getCommonHashtags()
            .then((result) => {
              this.commonTags = angular.copy(result);
              console.log('loader end');
              this.cfpLoadingBar.complete();
            });

          console.log('loader end');
          this.cfpLoadingBar.complete();
        })
    }

    //disconnects the attache notebook then calls updateTranscription
    disconnectNotebook(event) {
      let options = {
        title: 'Are you sure you want to disconnect this notebooks?',
        textContent: 'By clicking yes, you will disconnect the Notebook and it\'s associated media from this file.'
      };
      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            return;
          }
          delete event.file.notebookId;
          this.updateTranscription(event);
        })
    }
    //attached notebook to transcription file then calls updateTranscription
    attachNotebook(event) {
      event.settings = this.settings;
      this.dialogService.mediaAttachment(event, this.selectedFile)
        .then((result) => {
          if (result) {
            this.updateTranscription({file: result})
          }
        });
    }
    //removes independent media then calls updateTranscription
    disconnectMedia(event) {
      let options = {
        title: 'Are you sure you want to disconnect this media attachment?',
        textContent: 'By clicking yes you will remove this media attachment from the application',
      };

      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            return;
          }
          console.log('loader begin');
          this.cfpLoadingBar.start();
          this.selectedFile.removeItem = []; //create this temp property to send to server
          this.selectedFile.removeItem.push(event.media);
          delete this.selectedFile[event.type]; //delete this property...

          this.updateTranscription({file: this.selectedFile})
        })
    }


    ////////////
    //Settings//
    ////////////

    //update project data
    updateProject(event) {
      this.cfpLoadingBar.start();
      this.rootService.updateProject(event.project)
        .then((data) => {
          this.project = angular.copy(data);
          this.cfpLoadingBar.complete();
        })
    }
    //update settings
    //TODO: refractor as updateSettings()
    saveMediaSettings(event) {
      this.cfpLoadingBar.start();
      this.rootService.updateSettings(event.settings, this.currentUser)
        .then((data) => {
          this.cfpLoadingBar.complete();
          this.settings = angular.copy(data);
        })
    }
    //export all project data
    exportProject(event) {
      let options = {};
      options.title = "Are you sure you want to export all your project data?";
      options.textContent = "This may take a few minutes...";
      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            this.isLoading = false;
            return;
          }

          this.isLoading = true;
          console.log('loader begin');
          this.cfpLoadingBar.start();

          this.rootService.exportProject(event.project)
            .then((data) => {
              this.isLoading = false;
              console.log('loader end');
              this.cfpLoadingBar.complete();
            });
        });
    }
    //upload an avatar image; also normalizes notebooks
    uploadAvatar(event) {
      console.log('loader begin');
      this.cfpLoadingBar.start();
      this.rootService.uploadAvatar(event.file)
        .then((data) => {
          this.currentUser = angular.copy(data.user);
          this.notebooks = this.notebooks.map((notebook) => {
            let exists = false;
            let updated = {};
            data.notebooks.forEach((nb) => {
              if (nb._id === notebook._id) {
                exists = true;
                updated = nb;
              }
            });

            if (exists) {
              return updated;
            } else {
              return notebook;
            }
          });
          console.log('loader end');
          this.cfpLoadingBar.complete();
          this.ipcSerivce.send('broadcast:profile-updates')
        })
        .catch((err) => {
          console.log('Error:', err);
        });
    }
    //remove avatar image; also normalizes notebooks
    removeAvatar(event) {
      console.log('loader begin');
      this.cfpLoadingBar.start();
      this.rootService.removeAvatar(event.file, this.currentUser)
        .then((data) => {
          this.currentUser = angular.copy(data.user);

          this.notebooks = this.notebooks.map((notebook) => {
            let exists = false;
            let updated = {};
            data.notebooks.forEach((nb) => {
              if (nb._id === notebook._id) {
                exists = true;
                updated = nb;
              }
            });

            if (exists) {
              return updated;
            } else {
              return notebook;
            }
          });
          console.log('loader end');
          this.cfpLoadingBar.complete();
          this.ipcSerivce.send('broadcast:profile-updates')
        })
        .catch((err) => {
          console.log('Error:', err);
        });
    }
    //update 'profile' information.
    updateUserInfo(event) {
      console.log('loader begin');
      this.cfpLoadingBar.start();
      //http request
      this.rootService.updateUserInfo(event.currentUser)
        .then((data) => {
          this.currentUser = angular.copy(data.user);
          this.notebooks = this.notebooks.map((notebook) => {
            let exists = false;
            let updated = {};
            data.notebooks.forEach((nb) => {
              if (nb._id === notebook._id) {
                exists = true;
                updated = nb;
              }
            });

            if (exists) {
              return updated;
            } else {
              return notebook;
            }
          });

          this.ipcSerivce.send('broadcast:profile-updates');
          console.log('loader end');
          this.cfpLoadingBar.complete();
        })
    }
    //TODO: remove dialog service and just create it here for simplicity
    //handles event after user chooses  to toggle sharing or not
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
            //trigger changes back down the child components
            this.settings = angular.copy(this.settings)
          } else {
            //this updates the persisted data and the global.initialState object
            this.rootService.updateSettings({isSharing: event.isSharing}, this.currentUser)
              .then((data) => {
                //data should be the correct object (unless there are errors), however, for consistency sake, becuase __appData is electron global object that we update with the put request on the api server, we can set it to the __appData object as we do in the resolve of the app route
                //this ensures all our data is normalized for each session and persisted over multiple sessions and at each moment.
                //essential our one source of truth will be from __appData which will be updated through express.
                //this should be done with all api calls
                //on this copy specifically, it updates all child components twice, I belive this is because of md-switch's internal state

                this.settings = angular.copy(data);

                this.rootService.toggleSharing(this.settings.isSharing)


              })
          }
        })
    }

    //follow an online user
    toggleFollow(event) {
      this.rootService.toggleFollow(event.user)
        .then((data) => {
        if (!data.remove) {
          this.allConnections = this.allConnections.map((connection) => {
            if (connection._id !== data._id) {
              return connection;
            }
            return data;
          })
        } else {
          this.allConnections = this.allConnections.filter(connection => connection._id !== data._id);
          }
        })
    };


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
        this.allConnections.push(data.connection)
      }

      //copy to trigger changes
      this.allConnections = angular.copy(this.allConnections);

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




    ////////////
    //Notebook//
    ////////////

    //new notebook
    saveNotebook(event) {
      console.log('loader begin');
      this.cfpLoadingBar.start();
      this.rootService.createNotebook(event.notebook, this.currentUser, this.project._id, this.hashtags)
        .then((data) => {
          this.notebooks = [data.notebook, ...this.notebooks];
          if(data.hashtags) {
            this.hashtags = [...this.hashtags, ...data.hashtags];
          }
          this.rootService.getCommonHashtags()
            .then((result) => {
              this.commonTags = angular.copy(result);
              console.log('loader end');
              this.cfpLoadingBar.complete();
            });
          this.$mdDialog.hide();
          if (this.currentUser.isSharing) {
            console.log('broadcast data');
            this.ipcSerivce.send('new:notebook', {notebook: data.notebook, user: this.currentUser});
          }
        });


    }
    // update notebook
    updateNotebook(event) {
      console.log('loader begin');
      this.cfpLoadingBar.start();
      this.rootService.updateNotebook(event.notebook, this.hashtags)
        .then((data) => {
          this.$mdDialog.hide();

          this.notebooks = this.notebooks.map((notebook) => {
            if (notebook._id !== data.notebook._id) {
              return notebook;
            }
            return data.notebook;
          });

          if(data.hashtags) {
            this.hashtags = [...this.hashtags, ...data.hashtags];
          }
          this.rootService.getCommonHashtags()
            .then((result) => {
              this.commonTags = angular.copy(result);
              console.log('loader end');
              this.cfpLoadingBar.complete();
            });


          if (this.currentUser.isSharing) {
            console.log('broadcast data')
          }
        })
    }
    //remove notebook
    deleteNotebook(event) {
      let options = {
        title: "Are you sure you want to delete this post?",
        textContent: "By deleting this post... it wont be here anymore..."
      };

      this.$mdDialog.show({
        controller: () => this,
      });

      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            this.viewDetails(event);
          } else {
            console.log('loader begin');
            this.cfpLoadingBar.start();
            this.rootService.deleteNotebook(event.notebook)
              .then((data) => {
                //if transcriptions were modified....
                if (data.transcriptions) {
                  data.transcriptions.forEach((t) => {
                    this.transcriptions = this.transcriptions.map((trans) => {
                      if (t._id !== trans._id) {
                        return trans
                      }
                      return t;
                    })
                  });
                }

                this.notebooks = this.notebooks.filter((notebook) => notebook._id !== data.notebookId);
                console.log('loader end');
                this.cfpLoadingBar.complete();
                if (this.currentUser.isSharing) {
                  console.log('broadcast data');
                  this.broadcastData('remove:notebook', {notebookId:data.notebookId})
                }
              });
          }
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
      switch (event.notebook.postType) {
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
            escapeToClose: false,
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
            escapeToClose: false,
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
            escapeToClose: false,
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

    ////////////
    //hashtags//
    ////////////

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
    removeTag(event) {
      this.rootService.removeTag(event.tag)
        .then((data) => {
          this.hashtags = this.hashtags.filter((tag) => tag._id !== event.tag._id);

          data.notebooks.forEach((notebook) => {
            this.notebooks = this.notebooks.map((nb) => {
              if (nb._id !== notebook._id) {
                return nb;
              }
              return notebook;
            })
          });

          data.transcriptions.forEach((transcription) => {
            this.transcriptions = this.transcriptions.map((tr) => {
              if (tr._id !== transcription._id) {
                return tr;
              }
              return transcription;
            })
          });

          this.selectInitialFile();
          this.rootService.getCommonHashtags()
            .then((result) => {
              this.commonTags = angular.copy(result);
            });
        })
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
      this.ipcSerivce.send('combine:notebooks')
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

          for (let i = 0, len = this.notebooks.length; i < len; i++) {
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
        for (let i = 0, len = this.notebooks.length; i < len; i++) {
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

    broadcastData(event, data) {
      this.ipcSerivce.send(data)
    }

  },
};
