import templateUrl from './notebook.html';
import AttachmentTemplate from '../../components/dialog/dialog-notebook/dialog.notebook-normal.html';
import NotebookPreview from './notebook-dialogs/notebook-dialog-preview.html';

export const notebookComponent = {
  bindings: {
    allConnections: '<',
    notebooksData: '<',
    searchText: '<',
    currentUser: '<'
  },
  templateUrl,
  controller: class NotebookComponent {
    constructor($scope, $timeout, DialogService, NotebookService, cfpLoadingBar, RootService, $mdDialog) {
      'ngInject';

      this.$scope = $scope;
      this.$timeout = $timeout;
      this.dialogService = DialogService;
      this.notebookService = NotebookService;
      this.cfpLoadingBar = cfpLoadingBar;
      this.rootService = RootService;
      this.$mdDialog = $mdDialog;


      this.$scope.$watch('this.isOpen', this.isOpenWatch.bind(this));
      this.$scope.$watch('this.uniqueUsers', (newValue) => {
        // console.log('there was a change in notebook....', newValue);
      });

      this.$scope.$on('update:externalData', this.updateExternalData.bind(this));
      this.$scope.$on('normalize:notebooks', this.normalizeNnotebooks.bind(this))

      this.deleteNotebook = this.deleteNotebook.bind(this);

    }

    $onChanges(changes) {
      console.log('$onChanges in notebook.component', changes);
      if (changes.searchText) {
        console.log('this.searchText', this.searchText)
      }
      if (changes.allConnections) {
        console.log('changes in allConnections');
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
    }

    $onInit() {
      console.log('this.notebooks', this.notebooks);
      this.isLoading = true;
      this.hidden = false;
      this.isOpen = false;
      this.hover = false;

      this.selected = [];

      this.items = [
        {name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio'},
        {name: "Create Image Post", icon: "camera_alt", direction: "left", type: 'image'},
        {name: "Create Normal Post", icon: "create", direction: "left", type: 'normal'}
      ];

      this.notebooks = [];
      this.externalNotebooks = [];
      this.commonTags = [];
      this.uniqueUsers = {};

      this.queryNotebooks();

      // this.rootService.getConnectionsCB((data) => {
      //   this.connections = data;
      // });

    }


    toggle(event) {
      let idx = event.list.indexOf(event.user._id);
      if (idx > -1) {
        this.selected.splice(idx, 1);
        this.selected = angular.copy(this.selected);
      }
      else {
        this.selected.push(event.user._id);
        this.selected = angular.copy(this.selected);
      }
    };

    // exists(user, list) {
    //   console.log('user', user);
    //   console.log('list', list);
    //   // console.log('list.indexOf(user._id) > -1', list.indexOf(user._id) > -1);
    //     return list.indexOf(user._id) > -1;
    // };
    //
    // toggle(user, list) {
    //   let idx = list.indexOf(user._id);
    //   if (idx > -1) {
    //     list.splice(idx, 1);
    //   }
    //   else {
    //     list.push(user._id);
    //   }
    // };

    queryNotebooks() {
      this.notebookService.getNotebooks()
        .then((data) => {
          this.notebooks = data;
          this.isLoading = false;
        })
    }

    queryCommonTags() {
      HashtagService.getCommonTags().then(function (data) {
        this.commonTags = data
      })
    }


    //TODO: deal with updating notebooks
    showNewUpdates() {
      this.externalNotebooks.forEach((newNotebook) => {
        newNotebook.isNew = true;
        if (this.notebooks.indexOf(newNotebook) < 0) {
          this.notebooks.push(newNotebook);
        }
      });
      this.externalNotebooks = [];
    }

    update(notebook) {
      this.notebookService.updateNotebook(notebook)
        .then((data) => {

      }).catch((data) => {

      })
    }

    deleteNotebook(event) {
      console.log('delteNotebook in notebook component', event);
    }

    /**
     * Calls the service method and waits for promise.  When promise returns, it means the data has been saved in the database and the file has been written to the filesystem then we push the created notebooks to the array
     * @param event - the event
     */
    viewDetails(event) {
      //get options depending on post type
      let postOptions = this.notebookService.postOptions(event);
      event.deleteNotebook = this.deleteNotebook;
      //open post dialog
      this.dialogService.notebookDetails(event, postOptions)
        .then((result) => {
          if (!result) {
            return;
          }
          if (result === 'hideToConfirm'){

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
                          this.notebooks.map((notebook, index) => {
                            if (notebook._id === event.notebook._id) {
                              this.notebooks.splice(index, 1);
                            }
                          });
                          this.cfpLoadingBar.complete();
                        }
                      });
                  }
              })
          } else if (result._id) {
          this.cfpLoadingBar.start();
            this.notebookService.updateNotebook(result)
              .then((data) => {
                this.notebooks.map((notebook, index) => {
                  if (notebook._id === data._id) {
                    this.notebooks[index] = data;
                  }
                });
                this.cfpLoadingBar.complete();
              })
              .catch((data) => {
                this.cfpLoadingBar.complete();
                console.log('There was an error ', data)
              })
          } else {
            this.notebookService.createNotebook(result)
              .then((data) => {
                this.notebooks.push(data);
                this.cfpLoadingBar.complete();
              })
              .catch((data) => {
                console.log('There was an error ', data);
                this.cfpLoadingBar.complete();
              })
          }
        })
        .catch((result) => {
          console.log('catch result', result);
        });
    }

    viewPreview(event) {
      console.log('viewPreview in notebook component', event);
      // event.simplemde = {
      //   toolbar: false,
      //   status: false,
      //   spellChecker: false,
      //   autoDownloadFontAwesome: false,
      //   autoPreview: true
      // };

      this.notebook = event.notebook;
      this.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        autoPreview: true
      };

      this.$mdDialog.show({
        templateUrl: NotebookPreview,
        targetEvent: event,
        clickOutsideToClose: true,
        controller: () => this,
        controllerAs: '$ctrl',
      }).then((data) => {
        console.log('dialog closed',data);
        delete this.notebook;
      }).catch(() => {
        delete this.notebook;
        console.log('negative');
      })

    }

    cancel() {
      this.$mdDialog.cancel();
    }

    tagManageDialog() {
      this.dialogService.manageTags()
        .then((res) => {
          if (res.dataChanged) {
            this.queryNotebooks();
          }
        })
    }

    isOpenWatch(isOpen) {
      if (isOpen) {
        this.$timeout(() => {
          this.$scope.tooltipVisible = this.isOpen;
        }, 600);
      } else {
        this.$scope.tooltipVisible = this.isOpen;
      }
    }

    /**
     * Called when someone click the mini-fab button
     * @param event - the target event
     * @param type - the type of notebooks selected to create (picture, audio, normal)
     */
    newPost(event, type) {
      event.notebook = {
        postType: type
      };

      this.viewDetails(event)
    }

    updateExternalData(event, data) {

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

    normalizeNnotebooks(event, data) {
      this.notebooks.forEach((notebook) => {
        if (notebook.createdBy._id === data._id) {
          notebook.createdBy.name = data.name;
          notebook.createdBy.avatar = data.avatar;
        }
      })
    }


  }
};