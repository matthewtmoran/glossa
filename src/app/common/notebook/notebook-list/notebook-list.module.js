import { notebookListComponent } from './notebook-list.component';
import './notebook-list.scss';

export const notebookList = angular
  .module('components.notebook.notebookList', [])
  .component('notebookList', notebookListComponent)
  .name;