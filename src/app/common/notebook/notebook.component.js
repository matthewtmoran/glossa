import templateUrl from './notebook.html';
import SimpleMDE from 'simplemde';
import NotebookNormalTemplate from './notebook-dialog/notebook-dialog-normal.html';
import NotebookPreviewTemplate from './notebook-dialog/notebook-dialog-preview.html';
import NotebookImageTemplate from './notebook-dialog/notebook-dialog-image.html';
import NotebookAudioTemplate from './notebook-dialog/notebook-dialog-audio.html';
import { NotebookDialogController } from './notebook-dialog/notebook-dialog-controller';
import { SettingsHashtagsComponent } from '../settings/settings-hashtags/settings-hashtags.controller';
import SettingsHashtagsTemplate from '../settings/settings-hashtags/settings-hashtags.html';


export const notebookComponent = {
  bindings: {
    allConnections: '<',
    notebooks: '<',
    notebooksData: '<',
    settings: '<',
    searchText: '<',
    currentUser: '<',
    hashtags: '<',
    commonTags: '<',
    project: '<',
    newNotebooks: '<',
    onUpdateTag: '&',
    onSaveNotebook:'&',
    onUpdateNotebook:'&',
    onDeleteNotebook:'&',
    onViewNotebookDetails: '&',
    onTagManageDialog: '&',
    onShowNewNotebookUpdates: '&',
    onCancel:'&',
    onHide: '&'
  },
  templateUrl,
  controller: class NotebookComponent {
    constructor($scope, $timeout, DialogService, NotebookService, cfpLoadingBar, RootService, $mdDialog) {
      'ngInject';

      this.$scope = $scope;
      this.$timeout = $timeout;
      this.dialogService = DialogService;
      this.notebookService = NotebookService;
      this.cfpLoadingBar = cfpLoadingBar;
      this.rootService = RootService;
      this.$mdDialog = $mdDialog;


      this.$scope.$watch('this.isOpen', this.isOpenWatch.bind(this));
      this.$scope.$watch('this.uniqueUsers', (newValue) => {
        // console.log('there was a change in notebook....', newValue);
      });

    }

    $onChanges(changes) {
      if (changes.notebooks) {
        this.notebooks = angular.copy(changes.notebooks.currentValue);
      }
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue);
      }
      if (changes.commonTags) {
        this.commonTags = angular.copy(changes.commonTags.currentValue);
      }
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
      if (changes.newNotebooks) {
        this.newNotebooks = angular.copy(changes.newNotebooks.currentValue);
      }
    }

    $onInit() {
      this.isLoading = false;
      this.hidden = false;
      this.isOpen = false;
      this.hover = false;
      this.selected = [];
      this.initSelected();

      this.selectedHashtags = [];

      this.items = [
        {name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio'},
        {name: "Create Image Post", icon: "camera_alt", direction: "left", type: 'image'},
        {name: "Create Normal Post", icon: "create", direction: "left", type: 'normal'}
      ];

      this.externalNotebooks = [];
      this.uniqueUsers = {};

    }

    initSelected() {
      this.selected = this.allConnections.map((connection) => {
        if (connection.following) {
          return connection._id;
        }
      });
      this.selected = [
        ...this.selected,
        this.currentUser._id
      ]
    }

    //pass to app.component
    update(event) {
      this.onUpdateNotebook({
        $event: event
      })
    }

    //pass to app.component
    save(event) {
      this.onSaveNotebook({
        $event: event
      })
    }

    //pass to app.component
    deleteNotebook(event) {
      this.onDeleteNotebook({
        $event: event
      })
    }

    //pass to app.component
    updateTag(event) {
      this.onUpdateTag({
        $event: {
          tag: event.tag
        }
      })
    }

    //pass to app.component
    viewDetails(event, type) {
      event.type = type;
      this.onViewNotebookDetails({
        $event: event
      })
    };

    //pass to app.component
    tagManageDialog() {
      this.onTagManageDialog()
    }

    cancel(event) {
      this.onCancel({
        $event: event
      })
    }

    hide(event) {
      this.onHide({
        $event: event
      })
    }

    //TODO: deal with updating notebooks
    //pass to app.component
    showNewUpdates() {
      this.onShowNewNotebookUpdates({
        $event: {}
      });
    }


    //TODO: refractro to use same function as viewDetails...
    viewPreview(event) {
      this.notebook = event.notebook;
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
          onDeleteNotebook: this.deleteNotebook.bind(this),
          onHide: this.hide.bind(this),
          onUpdate: this.update.bind(this),
          onSave: this.save.bind(this)
        }
      }).then((data) => {

      }).catch(() => {

      })

    }


    toggleHashtags(tag) {
      let idx = this.selectedHashtags.indexOf(tag._id);

      if (idx > -1) {
        this.selectedHashtags.splice(idx, 1);
        this.selectedHashtags = angular.copy(this.selectedHashtags);
      } else {
        this.selectedHashtags.push(tag._id);
        this.selectedHashtags = angular.copy(this.selectedHashtags);
      }

    }

    toggle(event) {
      let idx = event.list.indexOf(event.user._id);
      if (idx > -1) {
        this.selected.splice(idx, 1);
        this.selected = angular.copy(this.selected);
      } else {
        this.selected.push(event.user._id);
        this.selected = angular.copy(this.selected);
      }
    };



    isOpenWatch(isOpen) {
      if (isOpen) {
        this.$timeout(() => {
          this.$scope.tooltipVisible = this.isOpen;
        }, 600);
      } else {
        this.$scope.tooltipVisible = this.isOpen;
      }
    }







  }
};