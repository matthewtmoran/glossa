import uiRouter from '@uirouter/angularjs';
import { settingsAboutComponent } from './settings-about.component';
// import { aboutSidebar } from './about-sidebar/about-sidebar.module';
// import { aboutMain } from './about-main/about-main.module';

import { aboutMainComponent } from './about-main/about-main.component';
import { aboutSidebarComponent } from './about-sidebar/about-sidebar.component';
import './settings-about.scss';

export const settingsAbout = angular
  .module('components.settings.about', [
    uiRouter,
    // aboutSidebar,
    // aboutMain
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
