import { notebookDialogComponent } from './notebook-dialog.component';
import './notebook-dialog.scss';

export const notebookDialog = angular
  .module('components.notebook.notebookDialog', [])
  .component('notebookDialog', notebookDialogComponent)
  .name;