import templateUrl from './app-nav.html';

export const navComponent = {
  bindings: {
    onSearchSubmit: '&'
  },
  templateUrl,
  controller: class NavComponent {
    constructor($state, $mdSidenav) {
      'ngInject';

      this.$mdSidenav = $mdSidenav;
    }

    $onChanges(changes) {
      console.log('$onChanges in app-nav', changes);
      if (changes.searchText) {
        this.searchSubmit();
      }
    }
    toggleDrawer(event) {
      this.$mdSidenav('drawer').toggle();
    }

    searchSubmit() {
      this.onSearchSubmit({
        $event: {
          searchText: this.searchText
        }
      })
    }
  }
};
