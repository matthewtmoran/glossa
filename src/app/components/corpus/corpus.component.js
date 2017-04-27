import templateUrl from './corpus.html';

export const corpusComponent = {
  bindings: {
    markDownFiles: '<'
  },
  templateUrl,
  controller: class CorpusComponent {
    constructor($state, $filter, CorpusService, cfpLoadingBar, DialogService, NotebookService) {
      'ngInject';
      this.cfpLoadingBar = cfpLoadingBar;
      // this.$state = $state;
      // this.filteredContacts = $filter('contactsFilter')(this.contacts, this.filter);
      this.corpusService = CorpusService;
      this.dialogService = DialogService;
      this.notebookService = NotebookService;
      this.filteredFiles = [];
      this.selectedFile = {};
      this.markDownFiles = [];

      // this.newAttachment = this.newAttachment.bind(this);

    }

    $onChanges(changes) {
      if (changes.markDownFiles) {
        this.markDownFiles = changes.markDownFiles.currentValue;
      }
      if (changes.selectedFiles) {

      }
    }

    $onInit() {
      if (this.markDownFiles.length > 0) {
        this.selectedFile = this.markDownFiles[0];
      } else {
        this.selectedFile = null;
      }
    }

    goToContact(event) {

    }

    newAttachment(event) {
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
                this.markDownFiles.map((file, index) => {
                  if (file._id === this.selectedFile._id) {
                    this.markDownFiles[index] = this.selectedFile;
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
          this.markDownFiles.push(data);
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
              this.markDownFiles.map((file, index) => {
                if (file._id === this.selectedFile._id) {
                  this.markDownFiles[index] = this.selectedFile;
                }
              });

              this.cfpLoadingBar.complete();
            })
            .catch((data) => {
              console.log('there was an issue', data)
            });
        })
    }

    fileSelection(event) {
      this.selectedFile = this.markDownFiles.find(file => file._id == event.fileId);
      if (this.selectedFile.notebookId) {
        this.getAttchachedNotebook(this.selectedFile.notebookId);
      } else {
        this.notebookAttachment = null;
      }
    }

    getAttchachedNotebook(notebookId) {
      this.notebookService.findNotebook(notebookId)
        .then((data) => {
          this.notebookAttachment = data;
        })
        .catch(() => {
          this.notebookAttachment = null;
        })
    }

    updateMarkdown(event) {
      this.cfpLoadingBar.start();
      this.corpusService.updateFile(event.file)
        .then((data) => {
          this.cfpLoadingBar.complete();
          this.selectedFile = data;
          this.markDownFiles.map((file, index) => {
            if (file._id === this.selectedFile._id) {
              this.markDownFiles[index] = this.selectedFile;
            }
          });

        })
        .catch((data) => {
          console.log('there was an issue', data)
        });
    }

    deleteMarkdown(event) {
      let options = {
        title: 'Are you sure you want to delete this markdown file?',
        textContent: 'By clicking yes, you confirm to delete all independently attached media files associated with this file?',
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

              this.markDownFiles.map((file, index) => {
                if (file._id === this.selectedFile._id) {
                  this.markDownFiles.splice(index, 1);
                }
              });

              this.selectedFile = this.markDownFiles[0];
              this.cfpLoadingBar.complete();
          })
        });
    }

    viewDetailsTop(event) {
      let postOptions = this.notebookService.postOptions(event);
      this.dialogService.viewDetails(event, postOptions);
    }
  },
};
