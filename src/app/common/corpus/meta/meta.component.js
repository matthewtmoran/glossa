import templateUrl from './meta.html';

export const metaComponent = {
  bindings: {
    notebookAttached: '<',
    selectedFile: '<',
    editorOptions: '<',
    onUpdate: '&',
    onAttachment: '&',
    onRemoveMedia: '&',
    onDeleteMarkdown: '&',
    onViewDetailsTop: '&',
    onUpdateModel: '&'
  },
  templateUrl,
  controller: class MetaComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      if (changes.selectedFile) {
        this.currentFile = angular.copy(this.selectedFile);
      }
    }

    $onInit() {
      this.editorOptions.updateFunction = this.update.bind(this)
    }

    update(event) {
      this.onUpdate({
        $event: {
          file: this.currentFile
        }
      })
    }

    //I update the model here because we are not necessarily saving the model.
    //I'm essentially binding it manually that way I can send the file opject as a whole on the blur event.
    updateModel(event) {
      this.currentFile.description = event.value;
    }

    //passes event up
    addAttachment() {
      this.onAttachment({
        $event: {
          currentFile: this.currentFile
        }
      })
    }

    //passes event up
    removeMedia(event, media, type) {
      this.onRemoveMedia({
        $event: {
          currentFile: this.currentFile,
          media: media,
          type: type
        }
      });
    }

    //passes event up
    deleteMarkdown() {
      this.onDeleteMarkdown({
        $event: {
          currentFile: this.currentFile,
        }
      })
    }

    //passes event up
    viewDetailsMid(event) {
      this.onViewDetailsTop({
        $event: event
      });
    }

    //
    // goToContact(event) {
    //
    // }
    //
    // actionItem() {
    //   this.func();
    // }
  },
};
