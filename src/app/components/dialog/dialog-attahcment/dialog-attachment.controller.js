export class AttachmentController {
  constructor($scope, DialogService, currentFile, $window, NotebookService, CorpusService, $q) {
    'ngInject';
    this.$scope = $scope;
    this.dialogService = DialogService;
    this.currentFile = currentFile;
    this.$window = $window;
    this.notebookService = NotebookService;
    this.corpusService = CorpusService;
    this.$q = $q;

    this.notebooksFiltered = [];
    this.searchText = '';
    this.items = [
      {name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio'},
      {name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image'}
    ];

    this.$scope.$watch(() => this.currentFile.image, this.imageWatcher.bind(this));
    this.$scope.$watch(() => this.currentFile.audio, this.audioWatcher.bind(this));

    this.init()
  }

  init() {
    this.notebookService.getNotebooks()
      .then((data) => {
        this.notebooks = data;
    })
  }

  cancel() {
    this.dialogService.cancel(false)
  }

  hide() {
    this.dialogService.hide(false)
  }

  save() {

    if(this.notebookSelected) {
      this.attachNotebook(this.notebookSelected)
    }

    this.dialogService.hide(this.currentFile);
  }

  attachNotebook(notebook) {
    this.$q.when(this.corpusService.attachNotebook(this.currentFile, notebook))
      .then((response) => {
        this.currentFile = response.file;
      });
  }

  showNotebookPreview(notebook) {
    this.notebookSelected = notebook
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
;