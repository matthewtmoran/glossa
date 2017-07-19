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
          url: '',
          avatar: 'assets/moran-avatar.jpg'
        },
        {
          name: 'Chris Jones',
          title: 'Field Linguist',
          url: 'onechrisjones.me',
          avatar: 'assets/jones-avatar.jpg'
        },
        {
          name: 'Justin Rees',
          title: 'Project Manager',
          url: 'tribeordie.com',
          avatar: ''
        }
      ];

      this.softwares = [
        {
          name: 'Angular Material',
          url: 'https://material.angularjs.org/'
        },
        {
          name: 'Node',
          url: 'https://nodejs.org/en/'
        },
        {
          name: 'Electron',
          url: 'https://electron.atom.io/'
        },
        {
          name: 'NeDB',
          url: 'https://github.com/louischatriot/nedb'
        },
        {
          name: 'Bonjour',
          url: 'https://www.npmjs.com/package/bonjour'
        },
        {
          name: 'Socket.io',
          url: 'https://socket.io/'
        },
        {
          name: 'SimpleMDE',
          url: 'https://simplemde.com/'
        },
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