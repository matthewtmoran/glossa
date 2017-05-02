import templateUrl from './meta.html';

export const metaComponent = {
  bindings: {
    notebookAttached: '<',
    selectedFile: '<',
    onUpdate: '&',
    onAttachment: '&',
    onRemoveMedia: '&',
    onDeleteMarkdown: '&',
    onViewDetailsTop: '&'
  },
  templateUrl,
  controller: class MetaComponent {
    constructor() {
      'ngInject';

      //expose so we can call it from simplmde directive.
      this.update = (field, file) => {
        this.onUpdate({$event: {file: this.currentFile}});
      };

    }

    $onChanges(changes) {
      console.log('changes in meta componenet', changes);
      if (changes.selectedFile) {
        console.log('selected file changed...', this.selectedFile);
        this.currentFile = angular.copy(this.selectedFile);
      }
      this.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        forceSync: true,
        placeholder: 'Description...',
        updateFunction: this.update.bind(this)
      };
    }

    $onInit() {
      this.isOpen = false;
    }

    addAttachment() {
      this.onAttachment({
        $event: {
          currentFile: this.currentFile
        }
      })
    }

    removeMedia(event, media, type) {
      this.onRemoveMedia({
        $event: {
          currentFile: this.currentFile,
          media: media,
          type: type
        }
      });
    }

    deleteMarkdown() {
      this.onDeleteMarkdown({
        $event: {
          currentFile: this.currentFile,
        }
      })
    }

    $onInit() {
      // this.selectedFile = this.corpusCtrl.selectedFile;

    }

    goToContact(event) {

    }

    viewDetailsMid(event) {
      this.onViewDetailsTop({
        $event: event
      });
    }

    actionItem() {
      this.func();
    }
  },
};
