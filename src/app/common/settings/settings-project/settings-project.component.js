import templateUrl from './settings-project.html';

export const settingsProjectComponent = {
  bindings: {
    project: '<',
    onUpdateProject: '&',
    onExportProject: '&'
  },
  templateUrl,
  controller: class SettingsProjectComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      if (changes.project) {
        this.project = angular.copy(changes.project.currentValue);
      }
    }

    updateProject() {
      this.onUpdateProject({
        $event: {
          project: this.project
        }
      })
    }

    exportProject() {
      this.onExportProject({
        $event: {
          project: this.project
        }
      })
    }


  }
};