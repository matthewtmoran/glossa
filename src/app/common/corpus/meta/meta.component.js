import templateUrl from './meta.html';

export const metaComponent = {
  bindings: {
    notebookAttached: '<',
    selectedFile: '<',
    editorOptions: '<',
    hashtags: '<',
    onUpdate: '&',
    onAttachment: '&',
    onRemoveMedia: '&',
    onDeleteMarkdown: '&',
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
      console.log('$onChanges meta.component', changes);
      if (changes.selectedFile) {
        console.log('changes in selectedFile');
        this.currentFile = angular.copy(changes.selectedFile.currentValue);
      }
      if (changes.notebookAttached) {
        console.log('changes in notebookAttached');
        this.notebookAttached = angular.copy(changes.notebookAttached.currentValue);
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

    disconnectNotebook(event) {
      this.onDisconnectNotebook({
        $event: {
          file: this.currentFile
        }
      })
    }

    //passes event up
    viewDetails(event) {
      console.log('viewDetailsMid')
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
