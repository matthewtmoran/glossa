import templateUrl from './tag-list.html';

export const tagListComponent = {
  bindings: {
    commonTags: '<',
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
      if (changes.selectedHashtags) {
        this.selectedHashtags = angular.copy(changes.selectedHashtags.currentValue);
      }
      if (changes.commonTags) {
        this.commonTags = angular.copy(changes.commonTags.currentValue);
      }
    }

    toggleHashtags(tag) {
      this.onToggleHashtags({
        $event: {
          list: this.selectedHashtags,
          tag: tag
        }
      })
    }

    tagManageDialog() {
      this.onTagManage()
    }

    exists(tag) {
      return this.selectedHashtags.indexOf(tag) > -1;
    }



  }
};
