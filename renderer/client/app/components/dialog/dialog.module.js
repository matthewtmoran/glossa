// import { notebookDialog } from './dialog-notebook/dialog-notebook.module';
import { attachmentDialog } from './dialog-attahcment/dialog-attachment.module';
import { DialogService } from './dialog.service';

export const dialogs = angular
  .module('common.dialog', [
    // notebookDialog,
    attachmentDialog
  ])
  .service('DialogService', DialogService)
  .name;
