import uiRouter from 'angular-ui-router';
import { settingsHashtagsComponent } from './settings-hashtags.component';
import TagFilter from './hashtag.filter';
import './settings-hashtags.scss';

export const settingsHashtags = angular
  .module('components.settings.hashtags', [
    uiRouter,
  ])
  .component('settingsHashtags', settingsHashtagsComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('hashtags', {
        parent: 'settings',
        url: '/hashtags',
        component: 'settingsHashtags',
      });
  })
  .filter('tagFilter', TagFilter)
  .name;
