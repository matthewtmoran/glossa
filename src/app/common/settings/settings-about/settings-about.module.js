import uiRouter from '@uirouter/angularjs';
import { settingsAboutComponent } from './settings-about.component';
import { aboutMainComponent } from './about-main/about-main.component';
import { aboutSidebarComponent } from './about-sidebar/about-sidebar.component';
import './settings-about.scss';

export const settingsAbout = angular
  .module('components.settings.about', [
    uiRouter,
  ])
  .component('settingsAbout', settingsAboutComponent)
  .component('aboutMain', aboutMainComponent)
  .component('aboutSidebar', aboutSidebarComponent)
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
