import templateUrl from './settings-media.html';

export const settingsMediaComponent = {
  bindings: {
    settings: '<',
    onSaveMediaSettings: '&'
  },
  templateUrl,
  controller: class SettingsMediaComponent {
    constructor() {
      'ngInject';

      this.defaultSettings = {
        waveColor: 'black',
        skipLength: 2
      };
      this.waveColorOptions = [
        {
          name: 'Red',
          value: 'red'
        },
        {
          name: 'White',
          value: 'white'
        },
        {
          name: 'Blue',
          value: 'blue'
        },
        {
          name: 'Purple',
          value: 'Purple'
        },
        {
          name: 'Black',
          value: 'black'
        }
      ];
    }

    $onInit() {

    }

    saveMediaSettings() {
      console.log('UpdateProject TODO: pass function stuff');
      this.onSaveMediaSettings({
        $event: {
          settings: this.settings
        }
      })
    }

    exportProject() {
      console.log('exportProject TODO: pass function stuff');
      this.onExportProject({
        $event: {
          media: this.project
        }
      })
    }


  }
};