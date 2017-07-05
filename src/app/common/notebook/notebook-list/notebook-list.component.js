import templateUrl from './notebook-list.html';

export const notebookListComponent = {
  bindings: {
    currentUser: '<',
    searchText: '<',
    notebooks: '<',
    selected: '<',
    settings: '<',
    selectedHashtags: '<',
    hashtags: '<',
    onViewDetails: '&',
    onViewPreview: '&',
  },
  templateUrl,
  controller: class NotebookListComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      if (changes.currentUser) {
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue);
      }
      // if (changes.selected) {
      //   this.selected = angular.copy(changes.selected.currentValue);
      // }
    }

    $onInit() {
      // this.selected = [];
    }

    exists(user, list) {
      return list.indexOf(user._id) > -1;
    };

    toggle(user, list) {
      let idx = list.indexOf(user._id);
      if (idx > -1) {
        list.splice(idx, 1);
      }
      else {
        list.push(user._id);
      }
    };

    viewDetails(event) {
      this.onViewDetails({
        $event: {
          notebook: event.notebook
        }
      })
    }

    viewPreview(event) {
      this.onViewPreview({
        $event: {
          notebook: event.notebook
        }
      })
    }

  }
};
