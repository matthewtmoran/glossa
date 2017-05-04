import templateUrl from './settings-about.html';
import licenseDialog from './license-dialog.html';

export const settingsAboutComponent = {
  bindings: {
    project: '<',
    onUpdateProject: '&',
    onExportProject: '&'
  },
  templateUrl,
  controller: class SettingsAboutComponent {
    constructor($mdDialog) {
      'ngInject';
      this.$mdDialog = $mdDialog;
    }

    $onInit() {
      this.contributers = [
        {
          name: 'Matthew Moran',
          title: 'Software Engineer',
          url: 'http:........',
          avatar: ''
        },
        {
          name: 'Chris Jones',
          title: 'Field Linguist',
          url: 'onechrisjones.me',
          avatar: ''
        },
        {
          name: 'Justin Rees',
          title: '',
          url: 'tribeordie.com',
          avatar: ''
        }
      ];

      this.softwares = [
        {
          name: 'Angular Material',
          url: 'http://............'
        }
      ]

    }

    viewLicense(event) {
      this.$mdDialog.show({
        controller: () => this,
        controllerAs: '$ctrl',
        templateUrl: licenseDialog,
        targetEvent: event,
        clickOutsideToClose: true,
      })
        .then((data) => {

        return data;
      })
      .catch(() => {
        return false;
      })
    }

    cancel(msg) {
      this.$mdDialog.cancel();
    }

  }
};