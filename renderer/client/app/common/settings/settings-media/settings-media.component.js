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

    $onChanges(changes) {
      if (changes.settings) {
        this.settings = angular.copy(changes.settings.currentValue)
      }
    }

    saveMediaSettings() {
      this.onSaveMediaSettings({
        $event: {
          settings: this.settings
        }
      })
    }
  }
};