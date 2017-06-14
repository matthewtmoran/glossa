export class NotebookDialogController {
  constructor($scope, $timeout, $window, notebook, editorOptions, hashtags, onCancel, onDeleteNotebook, onHide, onUpdate, onSave, settings) {
  // constructor($scope, $timeout, $window) {
    'ngInject';

    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$window = $window;

    this.currentNotebook = angular.copy(notebook);
    this.editorOptions = editorOptions;
    this.onCancel = onCancel;
    this.onHide = onHide;
    this.onUpdate = onUpdate;
    this.onSave = onSave;
    this.hashtags = hashtags;
    this.onDeleteNotebook = onDeleteNotebook;
    this.settings = settings;

    this.$scope.$watch(() => this.currentNotebook.image, this.imageWatcher.bind(this));
    this.$scope.$watch(() => this.currentNotebook.audio, this.audioWatcher.bind(this));

    this.init()

  }

  $onChanges(changes) {
    if (changes.notebook) {
      this.currentNotebook = angular.copy(changes.notebook.currentValue)
    }
    if (changes.hashtags) {
      this.hashtags = angular.copy(changes.hashtags.currentValue);
    }
  }

  $onInit() {
    this.removedMedia = [];
    this.findDetailType();
    this.setDynamicItems();
  }

  init() {
    console.log('init in notebook-dialog-controller');
    this.removedMedia = [];
    this.findDetailType();
    this.setDynamicItems();
  }

  cancel() {
    this.onCancel({
      $event: {
        notebook: false
      }
    })
  }

  hide() {
    this.onHide({
      $event: {
        notebook: false
      }
    })
  }

  save() {
    this.onSave({
        notebook: this.currentNotebook
    })
  }

  update() {
    this.onUpdate({
      notebook: this.currentNotebook,
      removeItem: this.removedMedia
    })
  }

  //keep simplemde and ngmodel synced
  updateModel(event) {
    this.currentNotebook.description = angular.copy(event.value);
  }

  findDetailType() {
    if (!this.currentNotebook._id) {
      this.isNewPost = true;
    }
  }

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
        title: this.currentNotebook.name + ' Details',
        button: {
          action: this.update.bind(this),
          text: 'Update Post'
        }
      }
    }
  }

  deleteNotebook() {
    this.hide('hideToConfirm');
    this.onDeleteNotebook({
      notebook: this.currentNotebook
    })
  }

  removeMedia(media, selectedTile, otherTile) {
    if (media.createdAt) { //this tells us the media has been saved to the db before
      this.removedMedia.push(media);
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

}