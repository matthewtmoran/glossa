import uiRouter from '@uirouter/angularjs';
import { settingsMediaComponent } from './settings-media.component';
import './settings-media.scss';

export const settingsMedia = angular
  .module('components.settings.media', [
    uiRouter,
  ])
  .component('settingsMedia', settingsMediaComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('media', {
        parent: 'settings',
        url: '/media',
        component: 'settingsMedia',
      });
  })
  .name;
