import { NotebookDialogController } from './dialog-notebook.controller';
import './dialog-notebook.scss';

export const notebookDialog = angular
  .module('common.dialog.notebook', [])
  .controller('notebookDialogController', NotebookDialogController)
  .name;
