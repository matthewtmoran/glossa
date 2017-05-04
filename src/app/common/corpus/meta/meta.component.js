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

    //add update function if editorOptions come through meta
    //this enables us to bind this.currentFile and pass that up to corpus to do the save
    //we do this because we are manually binding the simplemde/codemirror value to the this.currentFile.description model property
    //this way from here we pass the complete object back up to corpus on updates.
    $onInit() {
      this.editorOptions.updateFunction = this.update.bind(this)
    }

    //passes event up
    update(event) {
      this.onUpdate({
        $event: {
          file: this.currentFile
        }
      })
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

    //I update the model here because we are not necessarily saving the model.
    //I'm essentially binding it manually that way I can send the file opject as a whole on the blur event.
    updateModel(event) {
      this.currentFile.description = event.value;
    }
  },
};
