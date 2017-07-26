import { AttachmentController } from './dialog-attachment.controller';
import './dialog-attachment.scss';

export const attachmentDialog = angular
  .module('common.dialog.attachment', [])
  .controller('attachmentController', AttachmentController)
  .name;
