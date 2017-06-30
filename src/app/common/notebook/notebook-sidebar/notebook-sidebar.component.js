import templateUrl from './notebook-sidebar.html';

export const notebookSidebarComponent = {
  bindings: {
    allConnections: '<',
    commonTags: '<',
    selectedHashtags: '<',
    onToggleHashtags: '&',
    onExists: '&',
    onToggle: '&',
    onTagManage: '&'
  },
  templateUrl,
  controller: class NotebookSidebarComponent {
    constructor() {
      'ngInject';


    }

    $onChanges(changes) {
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue)
      }
      if (changes.commonTags) {
        this.commonTags = angular.copy(changes.commonTags.currentValue)
      }
      if (changes.selectedHashtags) {
        this.selectedHashtags = angular.copy(changes.selectedHashtags.currentValue)
      }
    }

    $onInit() {

    }

    toggle(event) {
      this.onToggle({
        $event: event
      })
    }

    exists(event) {
      this.onExists({
        $event: event
      })
    }

    toggleHashtags(event) {
      this.onToggleHashtags({
        $event: event
      })
    }

    tagManageDialog() {
      this.onTagManage()
    }




  }
};
