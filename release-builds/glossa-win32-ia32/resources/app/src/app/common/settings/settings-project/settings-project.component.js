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
      console.log("$onChanges in setting-projedct.component", changes);
      if (changes.project) {
        console.log('changes with project');
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