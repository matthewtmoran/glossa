import { settingsProject } from './settings-project/settings-project.module';
import { settingsAbout } from './settings-about/settings-about.module';
import { settingsSharing } from './settings-sharing/settings-sharing.module';
import { settingsMedia } from './settings-media/settings-media.module';
import { settingsHashtags } from './settings-hashtags/settings-hashtags.module';
import { SettingsService } from './settings.service';
import {settingsComponent} from './settings.component';
import {SettingsTabIndex} from './settings-tab-index.directive';
import './settings.scss';

export const settings = angular
  .module('components.settings', [
    settingsProject,
    settingsAbout,
    settingsSharing,
    settingsMedia,
    settingsHashtags
  ])
  .component('settings', settingsComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('settings', {
        parent: 'app',
        url: '/settings',
        component: 'settings',
        resolve: {
          previousState: ($state) => {
            return {
              Name: $state.current.name || 'meta',
              Params: $state.params,
              URL: $state.href($state.current.name, $state.params)
            };
          }
        }
      })
  })
  .service('SettingsService', SettingsService)
  .directive('settingsTabIndex', ['$state', ($state) => new SettingsTabIndex($state)])
  .name;
