import templateUrl from './corpus.html';
import NotebookPreviewTemplate from '../notebook/notebook-dialog/notebook-dialog-preview.html';
import { NotebookDialogController } from '../notebook/notebook-dialog/notebook-dialog-controller';

export const corpusComponent = {
  bindings: {
    transcriptions: '<',
    notebooks: '<',
    searchText: '<',
    hashtags: '<',
    settings: '<'
  },
  templateUrl,
  controller: class CorpusComponent {
    constructor($scope, $mdDialog, CorpusService, cfpLoadingBar, DialogService, NotebookService, $mdToast, ParseService, $state) {
      'ngInject';
      this.$scope = $scope;
      this.$mdDialog = $mdDialog;
      this.$state = $state;
      this.$mdToast = $mdToast;

      this.cfpLoadingBar = cfpLoadingBar;

      this.corpusService = CorpusService;
      this.dialogService = DialogService;
      this.notebookService = NotebookService;

      this.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        forceSync: true,
        placeholder: 'Description...',
      };

      this.$scope.$on('createNamedMarkdown', this.namedMarkdown.bind(this));
      this.$scope.$on('newMarkdown', this.newMarkdown.bind(this));

    }

    $onChanges(changes) {
      if (changes.transcriptions) {
        this.transcriptions = angular.copy(changes.transcriptions.currentValue);
      }
      if (changes.searchText) {
        this.searchText = angular.copy(changes.searchText.currentValue);
      }
      if (changes.notebookAttachment) {
        this.notebookAttachment = angular.copy(changes.notebookAttachment.currentValue)
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue)
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
      if (changes.notebooks) {
        this.notebooks = angular.copy(changes.notebooks.currentValue);
      }
    }

    $onInit() {
      if (this.transcriptions.length < 1) {
        this.selectedFile = null;
      } else {
        this.selectFile({fileId: this.transcriptions[0]._id});
      }
      this.selectedIndex = this.$state.current.name === 'baseline' ? 1: 0;
    }

    newAttachment(event) {
      event.settings = this.settings;
      this.dialogService.mediaAttachment(event, this.selectedFile)
        .then((result) => {
          if (result) {

            this.corpusService.updateFile(result)
              .then((data) => {
                this.cfpLoadingBar.complete();
                this.selectedFile = data;
                if (this.selectedFile.notebookId) {
                  this.getAttchachedNotebook(this.selectedFile.notebookId);
                }
                this.transcriptions.map((file, index) => {
                  if (file._id === this.selectedFile._id) {
                    this.transcriptions[index] = this.selectedFile;
                  }
                });

              })
              .catch((data) => {
                console.log('there was an issue', data)
              });
          }
        });
    }

    newMarkdown(event) {
      this.cfpLoadingBar.start();
      this.corpusService.createFile()
        .then((data) => {
          this.cfpLoadingBar.complete();
          this.transcriptions.push(data);
          this.transcriptions = angular.copy(this.transcriptions);
          this.selectedFile = data;
          this.notebookAttachment = null;
        })
        .catch((data) => {
          console.log('there was an issue', data)
        });
    }

    namedMarkdown(event, data) {
      this.cfpLoadingBar.start();
      this.corpusService.createFile(data.name)
        .then((data) => {
          this.cfpLoadingBar.complete();
          this.transcriptions.push(data);
          //copy data so reference is updated.
          this.transcriptions = angular.copy(this.transcriptions);
          this.selectedFile = data;
          this.notebookAttachment = null;
        })
        .catch((data) => {
          console.log('there was an issue', data)
        });
    }

    removeMedia(event) {
      let options = {
        title: 'Are you sure you want to disconnect this media attachment?',
        textContent: 'By clicking yes you will remove this media attachment from the application',
      };
      this.dialogService.confirmDialog(options)
        .then((result) => {
          if (!result) {
            return;
          }

          this.cfpLoadingBar.start();
          this.selectedFile.removeItem = []; //create this temp property to send to server
          this.selectedFile.removeItem.push(event.media);
          delete this.selectedFile[event.type]; //delete this property...

          this.corpusService.updateFile(this.selectedFile)
            .then((data) => {

              this.selectedFile = data;
              this.transcriptions.map((file, index) => {
                if (file._id === this.selectedFile._id) {
                  this.transcriptions[index] = this.selectedFile;
                }
              });

              this.cfpLoadingBar.complete();
            })
            .catch((data) => {
              console.log('there was an issue', data)
            });
        })
    }

    //when a file is selected from the sidebar
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

    //TODO: pass this up to app.componenet;
    updateMarkdown(event) {
      console.log('TODO: pass this event to App.component');
      this.cfpLoadingBar.start();
      this.corpusService.updateFile(event.file)
        .then((data) => {
          this.cfpLoadingBar.complete();
          this.selectedFile = Object.assign({}, data);
          this.notebookAttachment = this.notebooks.find(notebook => notebook._id === this.selectedFile.notebookId);
          this.transcriptions.map((file, index) => {
            if (file._id === this.selectedFile._id) {
              this.transcriptions[index] = this.selectedFile;
            }
          });

          this.transcriptions = angular.copy(this.transcriptions);
        })
        .catch((data) => {
          console.log('there was an issue', data)
        });
    }

    deleteMarkdown(event) {
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

          this.cfpLoadingBar.start();
          this.corpusService.removeFile(this.selectedFile)
            .then((data) => {

              this.transcriptions.map((file, index) => {
                if (file._id === this.selectedFile._id) {
                  this.transcriptions.splice(index, 1);
                }
              });

              //copy reference to trigger $onChanges in child components
              this.transcriptions = angular.copy(this.transcriptions);

              if (this.transcriptions.length > 0) {
                this.fileSelection({fileId:this.transcriptions[0]._id})
              } else {
                this.selectedFile = null;
              }
              this.cfpLoadingBar.complete();
          })
        });
    }

    viewDetails(event) {
      this.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        autoPreview: true
      };

      // this.$mdDialog.show({
      //   templateUrl: NotebookPreviewTemplate,
      //   targetEvent: event,
      //   clickOutsideToClose: true,
      //   controller: () => this,
      //   controllerAs: '$ctrl',
      // }).then((data) => {
      //   console.log('dialog closed',data);
      //   delete this.notebook;
      // }).catch(() => {
      //   delete this.notebook;
      //   console.log('negative');
      // })

      this.$mdDialog.show({
        templateUrl: NotebookPreviewTemplate,
        targetEvent: event,
        clickOutsideToClose: true,
        controller: NotebookDialogController,
        controllerAs: '$ctrl',
        bindToController: true,
        locals: {
          settings: this.settings,
          hashtags: this.hashtags,
          notebook: event.notebook || {},
          editorOptions: this.editorOptions,
          onCancel: this.cancel.bind(this),
          onDeleteNotebook: this.disconnectNotebook.bind(this),
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
          this.updateMarkdown(event);
        })
    }
  },
};
