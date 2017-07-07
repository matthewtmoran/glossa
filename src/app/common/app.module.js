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
        // redirectTo: 'corpus',
        url: '/app',
        data: {
          requiredAuth: false,
        },
        resolve: {
          allConnections: (__appData) => __appData.initialState.connections,
          commonTags: (RootService) => RootService.getCommonHashtags(),
          currentUser: (__appData) => __appData.initialState.user,
          hashtags: (__appData) => __appData.initialState.hashtags,
          project: (__appData) => __appData.initialState.project,
          settings: (__appData) => __appData.initialState.settings,
          notebooks: (__appData) => __appData.initialState.notebooks,
        },
        component: 'app',
      });
  })
  .name;
