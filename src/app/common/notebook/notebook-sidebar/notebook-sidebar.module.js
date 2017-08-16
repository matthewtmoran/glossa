import { notebookSidebarComponent } from './notebook-sidebar.component';
import './notebook-sidebar.scss';

export const notebookSidebar = angular
  .module('components.notebook.notebookSidebar', [])
  .component('notebookSidebar', notebookSidebarComponent)
  .name;