import uiRouter from '@uirouter/angularjs';
import { appComponent } from './app.component';
// import { audioPreview } from '../components/basic-audio-preview/basic-audio-preview.module';
import { appNav } from './app-nav/app-nav.module';
import { appDrawer } from './app-drawer/app-drawer.module';
import { appSidebar } from './app-sidebar/app-sidebar.module';
import { corpus } from './corpus/courpus.module'
import { notebook } from './notebook/notebook.module'
import { settings } from './settings/settings.module'

import './app.scss';

export const app = angular
  .module('common.app', [
    uiRouter,
    appNav,
    appSidebar,
    appDrawer,
    corpus,
    notebook,
    settings,
    // audioPreview
  ])
  .component('app', appComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('app', {
        url: '/app',
        data: {
          requiredAuth: false,
        },
        resolve: {
          currentUser: (RootService) => RootService.getUser(),
          allConnections: (RootService) => RootService.getConnections(),
          hashtags: (RootService) => RootService.getHashtags(),
          commonTags: (RootService) => RootService.getCommonHashtags(),
          project: (RootService) => RootService.getProject(),
          settings: (RootService) => RootService.getSettings(),
          notebooks: (RootService) => RootService.getNotebooks(),
          transcriptions: (RootService) => RootService.getTranscriptions()
        },
        component: 'app',
      });
  })
  .name;
