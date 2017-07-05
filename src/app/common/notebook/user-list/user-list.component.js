import templateUrl from './user-list.html';

export const userListComponent = {
  bindings: {
    allConnections: '<',
    currentUser: '<',
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
      console.log('$onChanges in user-list.componentn', changes);
      if (changes.allConnections) {
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
      if (changes.selected) {
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

    //returns boolean if user is in list of users to filter notebooks by
    exists(user) {
      return this.selected.indexOf(user._id) > -1;
    }

    // $onInit() {
    //   this.selected = [];
    // }


  }
};
