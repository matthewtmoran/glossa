import templateUrl from './corpus-sidebar.html';

export const corpusSidebarComponent = {
  bindings: {
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
