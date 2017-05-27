import { corpusSidebarComponent } from './corpus-sidebar.component';
import './corpus-sidebar.scss';

export const corpusSidebar = angular
  .module('common.corpus-sidebar', [])
  .component('corpusSidebar', corpusSidebarComponent)
  .name;
