import templateUrl from './drawer-link.html';

export const drawerLinkComponent = {
  templateUrl,
  bindings: {
    section: '<',
    onFocusSection: '&'
  },
  controller: class DrawerLinkComponent {
    constructor($mdSidenav) {
      'ngInject';

      this.$mdSidenav = $mdSidenav;
    }

    $onChanges(changes) {
      if (changes.section) {
        this.section = Object.assign({}, this.section);
      }
    }

    focusSection() {
      this.onFocusSection({
        $event: {
          autoFocusContent: false
        }
      });
      this.$mdSidenav('drawer').close();
      // this.autoFocusContent = true;
    }
  }
};