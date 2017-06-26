import templateUrl from './tag-list.html';

export const tagListComponent = {
  bindings: {
    commonTag: '<',
    selectedHashtags: '<',
    onToggleHashtags: '&',
    onTagManage: '&'
  },
  templateUrl,
  controller: class tagListComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.selected) {
        this.selected = angular.copy(changes.selected.currentValue);
      }
    }

    toggleHashtags(tag) {
      this.onToggleHashtags({
        $event: {
          tag: tag
        }
      })
    }

    tagManageDialog() {
      this.onTagManage()
    }



  }
};
