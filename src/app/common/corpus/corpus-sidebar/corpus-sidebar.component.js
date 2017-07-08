import templateUrl from './corpus-sidebar.html';

export const corpusSidebarComponent = {
  bindings: {
    searchText: '<',
    selectedFile: '<',
    markDownFiles: '<',
    fileSelection: '&',
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

      if (changes.markDownFiles) {
        this.markDownFiles = angular.copy(changes.markDownFiles.currentValue);
      }

    }

    $onInit() {
    }

    createNewMarkdown() {
      this.onNew()
    }

    onSelection(fileId) {
      this.fileSelection({
        $event: {
          fileId: fileId
        }
      });
    }
  },
};
