import { NotebookDialogController } from './notebook-dialog-controller';
import './notebook-dialog.scss';

export const notebookDialog = angular
  .module('components.notebook.notebookDialog', [])
  .controller('notebookDialogController', NotebookDialogController)
  .name;