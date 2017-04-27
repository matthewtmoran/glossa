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

    $onInit() {

    }

    updateProject() {
      console.log('UpdateProject TODO: pass function stuff');
      this.onUpdateProject({
        $event: {
          project: this.project
        }
      })
    }

    exportProject() {
      console.log('exportProject TODO: pass function stuff');
      this.onExportProject({
        $event: {
          project: this.project
        }
      })
    }


  }
};