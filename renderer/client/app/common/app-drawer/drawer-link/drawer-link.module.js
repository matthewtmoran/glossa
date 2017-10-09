import { drawerLinkComponent } from './drawer-link.component';
import './drawer-link.scss';

export const drawerLink = angular
  .module('common.app-drawer.drawer-link', [])
  .component('drawerLink', drawerLinkComponent)
  .name;