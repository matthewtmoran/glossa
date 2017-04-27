export class NotebookDialogController {
  constructor($scope, $timeout, $window, DialogService, simplemdeOptions,  NotebookService, notebook) {
    'ngInject';
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$window = $window;
    
    this.dialogService = DialogService;
    this.simplemdeOptions = simplemdeOptions; 
    this.notebookService = NotebookService;
    this.currentNotebook = angular.copy(notebook);
    this.removedMedia = [];
    
    this.dialogObject = {
      dataChanged: false,
      event: 'hide',
      // data: originalCopy
    };
    
    this.editorOptions = this.simplemdeOptions;

    this.$scope.$watch(() => this.currentNotebook.image, this.imageWatcher.bind(this));
    this.$scope.$watch(() => this.currentNotebook.audio, this.audioWatcher.bind(this));
    
    this.init();
    
  }
  
  init() {
    this.findDetailType();
    this.setDynamicItems();
  }

  cancel() {
    this.dialogService.cancel(false)
  }

  hide() {
    this.dialogService.hide(false)
  }

  save() {
    this.dialogService.hide(this.currentNotebook);
  }
  
  update() {
    if (this.removedMedia.length > 0) {
      this.currentNotebook.removeItem = this.removedMedia;
    }
    this.dialogService.hide(this.currentNotebook);
  }

    //precludes setDynamicItems
  findDetailType() {
    if (!this.currentNotebook._id) {
      this.isNewPost = true;
    }
  }
  //function to set at least some dynamic features... TODO: should be moved to service....
  setDynamicItems() {
    if (this.isNewPost) {
      this.postDetails = {
        title: 'Create New Post',
        button: {
          action: this.save.bind(this),
          text: 'Save Post'
        }
      }
    } else {
      this.postDetails = {
        title: this.notebook.name + ' Details',
        button: {
          action: this.update.bind(this),
          text: 'Update Post'
        }
      }
    }
  }
    //called if media is 'removed' saved to separate object to send with request to server
  removeMedia(media, selectedTile, otherTile) {
    if (media.createdAt) { //this tells us the media has been saved to the db before
      this.removedMedia.push(media);
    }
  }
    //this is called on cancel and run if media was 'removed' but not saved...
  restoreMedia() {
    if (this.removedMedia) {
      //replace the media if it was removed then details were canceled.
      this.removedMedia.forEach((media) => {
        if (media.mimetype.indexOf('audio') > -1) { //check if mimetype is an audio type...
          this.currentNotebook.audio = media;
        } else {
          this.currentNotebook.image = media;
        }
      })
    }
  }

  //TODO: find a better way to differentiate between files and a regular js object
  //keeps the audio path up to date depending if it is a file or object with path
  audioWatcher(newValue) {
    if (newValue) {
      if (newValue.originalname) {
        this.audioPath = newValue.path
      } else {
        this.audioPath = this.$window.URL.createObjectURL(newValue);
      }
    }
  }

  //keeps the image path up to date depeneidng if it is a file or object with path
  imageWatcher(newValue) {
    if (newValue) {
      if (newValue.originalname) {
        this.imagePath = newValue.path;
      } else {
        this.imagePath = window.URL.createObjectURL(newValue);
      }
    }
  }
  
  closeDetails() {
    this.dialogService.cancel();
  }

};