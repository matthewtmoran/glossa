import templateUrl from './corpus.html';
import NotebookPreviewTemplate from '../notebook/notebook-dialog/notebook-dialog-preview.html';
import { NotebookDialogController } from '../notebook/notebook-dialog/notebook-dialog-controller';

export const corpusComponent = {
  bindings: {
    transcriptions: '<',
    selectedFile: '<',
    notebookAttachment: '<',
    notebooks: '<',
    searchText: '<',
    hashtags: '<',
    settings: '<',
    onUpdateTranscription: '&',
    onCreateTranscription: '&',
    onRemoveTranscription: '&',
    onDisconnectNotebook: '&',
    onAttachNotebook: '&',
    onDisconnectMedia: '&',
    onSelectFile: '&'
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

      // this.$scope.$on('createNamedMarkdown', this.namedMarkdown.bind(this));
      this.$scope.$on('newMarkdown', this.createTranscription.bind(this));

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
      if (changes.selectedFile) {
        this.selectedFile = angular.copy(changes.selectedFile.currentValue);
      }
      if (changes.notebookAttached) {
        this.notebookAttached = angular.copy(changes.notebookAttached.currentValue);
      }
    }

    $onInit() {
      this.selectedIndex = this.$state.current.name === 'baseline' ? 1: 0;
    }

    attachNotebook(event) {
      this.onAttachNotebook({
        $event: event
      });
    }

    createTranscription(event) {
      this.onCreateTranscription({
        $event: event
      })
    }

    updateTranscription(event) {
      this.onUpdateTranscription({
        $event: event
      })
    }

    removeTranscription(event) {
      this.onRemoveTranscription({$event: event})
    }

    removeMedia(event) {
      this.onDisconnectMedia({
        $event: event
      })
    }

    //when a file is selected from the sidebar
    selectFile(event) {
      this.onSelectFile({$event: event});
    }





    viewDetails(event) {
      this.editorOptions = {
        toolbar: false,
        status: false,
        spellChecker: false,
        autoDownloadFontAwesome: false,
        autoPreview: true
      };

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
          onUpdate: this.updateTranscription.bind(this),
          onSave: this.createTranscription.bind(this)
        }
      }).then((data) => {
      }).catch(() => {
      })
    }

    cancel() {
      this.$mdDialog.cancel();
    }

    hide() {
      this.$mdDialog.hide();
    }

    disconnectNotebook(event) {
      this.onDisconnectNotebook({
        $event: event
      });
    }

  },
};
