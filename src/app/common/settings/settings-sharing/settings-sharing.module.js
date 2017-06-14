import uiRouter from '@uirouter/angularjs';
import { userCard } from './user-card/user-card.module';
import { settingsSharingComponent } from './settings-sharing.component';
import './settings-sharing.scss';

export const settingsSharing = angular
  .module('components.settings.sharing', [
    uiRouter,
    userCard
  ])
  .component('settingsSharing', settingsSharingComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('sharing', {
        parent: 'settings',
        url: '/sharing',
        component: 'settingsSharing',
      });
  })
  .name;
