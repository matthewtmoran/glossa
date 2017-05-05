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
      console.log('$onChanges in corpus-sidebar.component', changes);
      if (changes.searchText) {
        console.log('changes in searchText');
        this.searchText = angular.copy(changes.searchText.currentValue)
      }

      if (changes.selectedFile) {
        console.log('changes in selectedFile');
        this.selectedFile = angular.copy(changes.selectedFile.currentValue);
      }

      if (changes.markDownFiles) {
        // this.filteredFiles = [];
        console.log('changes in markDownFiles');
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
