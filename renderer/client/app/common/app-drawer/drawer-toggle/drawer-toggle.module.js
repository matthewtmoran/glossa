import { drawerToggleComponent } from './drawer-toggle.component';
import './drawer-toggle.scss';

export const drawerToggle = angular
  .module('common.app-drawer.drawer-toggle', [])
  .component('drawerToggle', drawerToggleComponent)
  .name;