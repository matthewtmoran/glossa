import templateUrl from './drawer-submenu.html';

export const drawerSubmenuComponent = {
  bindings: {
    section: '<'
  },
  templateUrl,
  controller: class DrawerSubmenuComponent {
    constructor(DrawerService, DialogService) {
      'ngInject';
      // this.originatorEv;
      this.drawerService = DrawerService;
      this.dialogService = DialogService;
    }


    execute(action, object) {
      if(angular.isFunction(scope[action])) {
        scope[action](object);
      }
    }

    deleteCorpus(val) {
      this.drawerService.deleteCorpus(val);
    }

    corpusDialog() {

      this.dialogService.corpusDialog();

    }


    openMenu($mdMenu, ev) {
      this.originatorEv = ev;
      $mdMenu.open(ev);
    };

  }
};