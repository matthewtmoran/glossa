import templateUrl from './app-drawer.html';

export const drawerComponent = {
  bindings: {
    project: '<'
  },
  templateUrl,
  controller: class DrawerComponent {
    constructor(DrawerService, $mdSidenav) {
      'ngInject';
      this.drawerService = DrawerService;
      this.menu = this.drawerService.section;
      this.$mdSidenav = $mdSidenav;
    }

    $onInit() {
      this.autoFocusContent = false;
    }

    isOpenParent(event) {
      return this.drawerService.isSectionSelected(event.section);
    }

    toggleOpen(event) {
      this.drawerService.toggleSelectSection(event.section);
    }

    isSettingsOpen(section) {
      return this.menu.isSectionSettingsSelected(section);
    }

    toggleSettingsOpen(section) {
      this.menu.toggleSettingsSection(section);
    }

    showSettings() {
      dialogSrvc.settingsFull();
    }

    focusSection() {
      this.autoFocusContent = true;
    }

    closeSideNav() {
      this.$mdSidenav('drawer').close();
    }



  }
};
