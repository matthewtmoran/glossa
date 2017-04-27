// import { AttachmentController } from './dialog-attahcment/dialog-attachment.controller'
import AttachmentTemplate from './dialog-attahcment/dialog-attahcment.html';
import NoEditNotebookTemplate from './dialog-notebook/dialog-notebook-no-edit.html';

export class DialogService {
  constructor($mdDialog) {
    'ngInject';
    this.$mdDialog = $mdDialog;
  }

  hide(data) {
    this.$mdDialog.hide(data);
  }

  cancel(data) {
    this.$mdDialog.cancel(data);
  }

  manageTags() {
    return this.$mdDialog.show({
      controller: manageTagsCtrl,
      controllerAs: 'tagVm',
      templateUrl: 'app/tagManagement/hashtags.dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      // bindToController: true,
    }).then((data) => {
      return data;
    }).catch((data) => {
      return data;
    })
  }

  mediaAttachment(ev, currentFile) {
    return this.$mdDialog.show({
      controller: 'attachmentController',
      templateUrl: AttachmentTemplate,
      controllerAs: '$ctrl',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: false,
      locals: {
        currentFile: currentFile,
      }
      // bindToController: true,
    }).then((data) => {
      return data;
    }).catch((data) => {
      return data;
    })
  }

  settingsFull() {
    return this.$mdDialog.show({
      controller: settingsCtrl,
      controllerAs: 'sVm',
      templateUrl: 'components/settings/settings.html',
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      bindToController: true,
      fullscreen: true

    }).then((data) => {
    }).catch((data) => {
      console.log('close on cancel or hide?', data);
    });
  }

  corpusDialog() {
    this.$mdDialog.show({
      templateUrl: 'components/drawer/corpus-management/manage-corpus.component.html',
      parent: angular.element(document.body),
      // targetEvent: ev,
      controller: manageCorpusCtrl,
      controllerAs: 'dialogVm',
      bindToController: true,
      clickOutsideToClose: false,
    }).then((data) => {
      return data;
    }).catch((data) => {
      return data;
    });
  }

  confirmDialog(options) {
    let confirm = this.$mdDialog.confirm()
      .title(options.title || 'Are you sure you want to do this?')
      .textContent(options.textContent || 'This will change things....')
      .ariaLabel('Confirm Dialog')
      .ok(options.okBtn || 'Yes')
      .cancel(options.cancelBtn || 'Cancel');

    return this.$mdDialog.show(confirm)
      .then((data) => {
        return data || true;
      })
      .catch((data) => {
        return data || false;
      });
  }

  notebookDetails(event, options) {
    console.log('event', event);
    return this.$mdDialog.show({
      controller: 'notebookDialogController',
      templateUrl: options.template,
      controllerAs: '$ctrl',
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: false,
      bindToController: true,
      locals: {
        simplemdeOptions: options.simplemde,
        notebook: event.notebook,
        onDeleteNotebook: event.deleteNotebook
      }
    }).then((data) => {
      return data;
    }).catch((data) => {
      return data;
    });
  }

  viewDetails(event, options) {
    console.log('viewDetails in dialog.service', event);
    return this.$mdDialog.show({
      controller: 'notebookDialogController',
      controllerAs: '$ctrl',
      templateUrl: NoEditNotebookTemplate,
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: false,
      bindToController: true,
      locals: {
        simplemdeOptions: options.simplemde,
        notebook: event.notebook,
        // onDeleteNotebook: event.deleteNotebook
      }
    }).then((data) => {

      return data;
    }).catch((err) => {

      console.log('error viewing details', err);

      return false;
    });
  }


}
