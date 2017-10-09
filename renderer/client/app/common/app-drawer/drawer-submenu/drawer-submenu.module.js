import { drawerSubmenuComponent } from './drawer-submenu.component';
import './drawer-submenu.scss';

export const drawerSubmenu = angular
  .module('common.app-drawer.drawer-submenu', [])
  .component('drawerSubmenu', drawerSubmenuComponent)
  .name;