import templateUrl from './corpus-sidebar.html';

export const corpusSidebarComponent = {
  bindings: {
    searchText: '<',
    selectedFile: '<',
    transcriptions: '<',
    onSelectFile: '&',
    onNew: '&'
  },
  templateUrl,
  controller: class CorpusSidebarComponent {
    constructor($transitions, $rootScope) {
      'ngInject';

      this.$rootScope = $rootScope;
      this.$transitions = $transitions;
      this.currentState = this.$rootScope.currentState;

    }

    $onChanges(changes) {
      if (changes.searchText) {
        this.searchText = angular.copy(changes.searchText.currentValue)
      }

      if (changes.selectedFile) {
        this.selectedFile = angular.copy(changes.selectedFile.currentValue);
      }

      if (changes.transcriptions) {
        this.transcriptions = angular.copy(changes.transcriptions.currentValue);
      }

    }

    $onInit() {

    }

    createNewMarkdown() {
      this.onNew()
    }

    selectFile(fileId) {
      this.onSelectFile({
        $event: {
          fileId: fileId
        }
      });
    }
  },
};
