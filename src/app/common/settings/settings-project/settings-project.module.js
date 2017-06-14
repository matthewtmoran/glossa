import uiRouter from '@uirouter/angularjs';
import { settingsProjectComponent } from './settings-project.component';
import './settings-project.scss';

export const settingsProject = angular
  .module('components.settings.project', [
    uiRouter,
  ])
  .component('settingsProject', settingsProjectComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('project', {
        parent: 'settings',
        url: '/project',
        component: 'settingsProject',
      });
  })
  .name;
