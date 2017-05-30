import templateUrl from './notebook-list.html';

export const notebookListComponent = {
  bindings: {
    currentUser: '<',
    searchText: '<',
    notebooks: '<',
    selected: '<',
    selectedHashtags: '<',
    hashtags: '<',
    onViewDetails: '&',
    onViewPreview: '&',
  },
  templateUrl,
  controller: class NotebookListComponent {
    constructor() {
      'ngInject';
      console.log('notebooklistcomponentn');
    }

    $onChanges(changes) {
      console.log('onChanges in notebook-list componenet', changes);
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
