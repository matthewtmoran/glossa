import templateUrl from './notebook.html';
import SimpleMDE from 'simplemde';
import NotebookNormalTemplate from './notebook-dialog/notebook-dialog-normal.html';
import NotebookPreviewTemplate from './notebook-dialog/notebook-dialog-preview.html';
import NotebookImageTemplate from './notebook-dialog/notebook-dialog-image.html';
import NotebookAudioTemplate from './notebook-dialog/notebook-dialog-audio.html';
import { NotebookDialogController } from './notebook-dialog/notebook-dialog-controller';
import { SettingsHashtagsComponent } from '../settings/settings-hashtags/settings-hashtags.controller';
import SettingsHashtagsTemplate from '../settings/settings-hashtags/settings-hashtags.html';


export const notebookComponent = {
  bindings: {
    allConnections: '<',
    notebooksData: '<',
    searchText: '<',
    currentUser: '<',
    hashtags: '<',
    commonTags: '<',
    onUpdateTag: '&'
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
      if (changes.searchText) {

      }
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue);
      }
      if (changes.commonTags) {
        this.commonTags = angular.copy(changes.commonTags.currentValue);
      }
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
    }

    $onInit() {
      this.isLoading = true;
      this.hidden = false;
      this.isOpen = false;
      this.hover = false;
      this.selected = [];
      this.selectedHashtags = [];

      this.items = [
        {name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio'},
        {name: "Create Image Post", icon: "camera_alt", direction: "left", type: 'image'},
        {name: "Create Normal Post", icon: "create", direction: "left", type: 'normal'}
      ];
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
        },
        // {
        //   name: "Help",
        //   action: this.test,
        //   className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        //   iconClass:'help',
        //   title: "Toggle Preview",
        // }
      ];

      this.notebooks = [];
      this.externalNotebooks = [];
      this.uniqueUsers = {};

      this.queryNotebooks();

    }

    toggleHashtags(tag) {
      let idx = this.selectedHashtags.indexOf(tag._id);

      if (idx > -1) {
        this.selectedHashtags.splice(idx, 1);
        this.selectedHashtags = angular.copy(this.selectedHashtags);
      } else {
        this.selectedHashtags.push(tag._id);
        this.selectedHashtags = angular.copy(this.selectedHashtags);
      }

    }


    toggle(event) {
      let idx = event.list.indexOf(event.user._id);
      if (idx > -1) {
        this.selected.splice(idx, 1);
        this.selected = angular.copy(this.selected);
      } else {
        this.selected.push(event.user._id);
        this.selected = angular.copy(this.selected);
      }
    };


    queryNotebooks() {
      this.notebookService.getNotebooks()
        .then((data) => {
          this.notebooks = data;
          this.isLoading = false;
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

    update(event) {
      this.cfpLoadingBar.start();
      this.notebookService.updateNotebook(event.notebook)
        .then((data) => {
          this.$mdDialog.hide();

          this.notebooks.map((notebook, index) => {
            if (notebook._id === data._id) {
              this.notebooks[index] = data;
            }
          });
          this.cfpLoadingBar.complete();
        })
    }

    save(event) {
      this.$mdDialog.hide();
      this.cfpLoadingBar.start();


      event.notebook.createdBy = {
        _id: this.currentUser._id,
        avatar: this.currentUser.avatar || null,
        name: this.currentUser.name
      };
      event.notebook.projectId = this.currentUser.session.projectId;

      this.notebookService.createNotebook(event.notebook)
        .then((data) => {
          this.notebooks.push(data);
          this.cfpLoadingBar.complete();
        })
        .catch((data) => {
          console.log('There was an error ', data);
          this.cfpLoadingBar.complete();
        });
    }

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

    }

    viewDetails(event, type) {

      if (!event.notebook) {
        event.notebook = {
          postType: type
        }
      }

      let state = {};
      switch(event.notebook.postType) {
        case 'image':
          this.notebook = event.notebook;
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
              hashtags: this.hashtags,
              notebook: event.notebook || {},
              editorOptions: this.editorOptions,
              onCancel: this.cancel.bind(this),
              onDeleteNotebook: this.deleteNotebook.bind(this),
              onHide: this.hide.bind(this),
              onUpdate: this.update.bind(this),
              onSave: this.save.bind(this)
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
              hashtags: this.hashtags,
              notebook: event.notebook || {},
              editorOptions: this.editorOptions,
              onCancel: this.cancel.bind(this),
              onDeleteNotebook: this.deleteNotebook.bind(this),
              onHide: this.hide.bind(this),
              onUpdate: this.update.bind(this),
              onSave: this.save.bind(this)
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
              hashtags: this.hashtags,
              notebook: event.notebook || {},
              editorOptions: this.editorOptions,
              onCancel: this.cancel.bind(this),
              onDeleteNotebook: this.deleteNotebook.bind(this),
              onHide: this.hide.bind(this),
              onUpdate: this.update.bind(this),
              onSave: this.save.bind(this)
            }
          };

          break;
        case 'default':
          console.log('error');
      }

      this.$mdDialog.show(state)
        .then((data) => {
          console.log('positive', data);
          return data;
        })
        .catch((data) => {
          console.log('negative', data);
          return data;
        });
    };

    viewPreview(event) {
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
        templateUrl: NotebookPreviewTemplate,
        targetEvent: event,
        clickOutsideToClose: true,
        controller: NotebookDialogController,
        controllerAs: '$ctrl',
        bindToController: true,
        locals: {
          hashtags: this.hashtags,
          notebook: event.notebook || {},
          editorOptions: this.editorOptions,
          onCancel: this.cancel.bind(this),
          onDeleteNotebook: this.deleteNotebook.bind(this),
          onHide: this.hide.bind(this),
          onUpdate: this.update.bind(this),
          onSave: this.save.bind(this)
        }
      }).then((data) => {
        console.log('dialog closed',data);
      }).catch(() => {
        console.log('negative');
      })

    }

    cancel() {
      this.$mdDialog.cancel();
    }

    hide() {
      this.$mdDialog.hide();
    }

    tagManageDialog() {
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

    updateTag(event) {
      this.onUpdateTag({
        $event: {
          tag: event.tag
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