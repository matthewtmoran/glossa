import templateUrl from './settings-about.html';

export const settingsAboutComponent = {
  bindings: {
    project: '<',
    onUpdateProject: '&',
    onExportProject: '&'
  },
  templateUrl,
  controller: class SettingsAboutComponent {
    constructor() {
      'ngInject';
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

  }
};