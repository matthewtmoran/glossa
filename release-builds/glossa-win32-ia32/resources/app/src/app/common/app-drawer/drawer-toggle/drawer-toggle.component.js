import templateUrl from './drawer-toggle.html';

export const drawerToggleComponent = {
  templateUrl,
  bindings: {
    section: '<',
    onToggleOpen: '&',
    onIsOpenParent: '&'
  },
  controller: class DrawerToggleComponent {
    constructor() {
      'ngInject';
    }

    toggle(event) {
      this.onToggleOpen({
        $event: {
          section: this.section
        }
      });
    }

    isOpen() {
      return this.onIsOpenParent({
        $event: {
          section: this.section
        }
      });
    }

    // focusSection() {
    //   this.autoFocusContent = true;
    // }
  }
};