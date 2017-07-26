import templateUrl from './meta.html';

export const metaComponent = {
  bindings: {
    notebookAttachment: '<',
    selectedFile: '<',
    editorOptions: '<',
    settings: '<',
    hashtags: '<',
    onUpdateTranscription: '&',
    onAttachNotebook: '&',
    onRemoveMedia: '&',
    onRemoveTranscription: '&',
    onViewDetails: '&',
    onUpdateModel: '&',
    onDisconnectNotebook: '&'
  },
  templateUrl,
  controller: class MetaComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      if (changes.selectedFile) {
        this.currentFile = angular.copy(changes.selectedFile.currentValue);
      }
      if (changes.notebookAttachment) {
        this.notebookAttachment = angular.copy(changes.notebookAttachment.currentValue);
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
    }

    //add update function if editorOptions come through meta
    //this enables us to bind this.currentFile and pass that up to corpus to do the save
    //we do this because we are manually binding the simplemde/codemirror value to the this.currentFile.description model property
    //this way from here we pass the complete object back up to corpus on updates.
    $onInit() {
      this.editorOptions.updateFunction = this.update.bind(this)
    }


    //called on blur
    //passed down to simplemde as well
    update(event) {
      this.onUpdateTranscription({
        $event: {
          file: this.currentFile
        }
      })
    }

    //passes event up
    attachNotebook() {
      this.onAttachNotebook({
        $event: {
          currentFile: this.currentFile
        }
      })
    }

    //passes event up
    removeMedia(event) {
      this.onRemoveMedia({
        $event: {
          currentFile: this.currentFile,
          media: event.file,
          type: event.type
        }
      });
    }

    //passes event up
    removeTranscription(fileId) {
      this.onRemoveTranscription({
        $event: {
          fileId: fileId,
        }
      })
    }

    disconnectNotebook(event) {
      this.onDisconnectNotebook({
        $event: {
          file: this.currentFile
        }
      })
    }

    //passes event up
    viewDetails(event) {
      this.onViewDetails({
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
