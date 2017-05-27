import templateUrl from './user-list.html';

export const userListComponent = {
  bindings: {
    allConnections: '<',
    selected: '<',
    onToggle: '&',
    onExists: '&',
  },
  templateUrl,
  controller: class UserListComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      console.log('onChanges in user-list component', changes);
      if (changes.allConnections) {
        console.log('changes in all connections');
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.selected) {
        console.log('changes in selected');
        this.selected = angular.copy(changes.selected.currentValue);
      }
    }

    toggle(user) {
      this.onToggle({
        $event: {
          list: this.selected,
          user: user
        }
      })
    }

    exists(user) {
      return this.selected.indexOf(user._id) > -1;
    }

    $onInit() {
      // this.selected = [];
    }


  }
};
