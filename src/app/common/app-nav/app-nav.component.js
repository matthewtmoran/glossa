import templateUrl from './app-nav.html';

  // bindings: {
    // user: '<',
    // onLogout: '&',
  // },
export const navComponent = {
  templateUrl,
  controller: class NavComponent {
    constructor($state, $mdSidenav) {
      'ngInject';

      this.$mdSidenav = $mdSidenav

    }
    toggleDrawer(event) {
      this.$mdSidenav('drawer').toggle();
    }
  }
};
