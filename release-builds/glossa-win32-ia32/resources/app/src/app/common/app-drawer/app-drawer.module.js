import { drawerComponent } from './app-drawer.component';
import { drawerLink } from './drawer-link/drawer-link.module';
import { drawerToggle } from './drawer-toggle/drawer-toggle.module';
import { drawerSubmenu} from './drawer-submenu/drawer-submenu.module';
import { DrawerService } from './app-drawer.service';
import Humanize from './app-drawer-humanize.filter';
import NoSpace from './app-drawer-nospace.filter';
import './app-drawer.scss';


export const appDrawer = angular
  .module('common.app-drawer', [
    drawerToggle,
    drawerLink,
    drawerSubmenu
  ])
  .service('DrawerService', DrawerService)
  .filter('nospace', NoSpace)
  .filter('humanize', Humanize)
  .component('appDrawer', drawerComponent)
  .name;
