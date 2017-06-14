import uiRouter from '@uirouter/angularjs';
import { settingsAboutComponent } from './settings-about.component';
import './settings-about.scss';

export const settingsAbout = angular
  .module('components.settings.about', [
    uiRouter,
  ])
  .component('settingsAbout', settingsAboutComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('about', {
        parent: 'settings',
        url: '/about',
        component: 'settingsAbout',
      });
  })
  .name;
