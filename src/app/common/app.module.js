import uiRouter from '@uirouter/angularjs';
import { appComponent } from './app.component';

// import { attachmentComponent } from './dialog/dialog-attahcment/dialog-attachment.controller';
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
    settings
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

          currentUser: (__appData) => __appData.initialState.user,
          settings: (__appData) => __appData.initialState.settings,
          project: (__appData) => __appData.initialState.project,
          allConnections: (__appData) => __appData.initialState.connections,
          hashtags: (__appData) => __appData.initialState.hashtags,

          commonTags: (RootService) => RootService.getCommonHashtags()

          // currentUser: (RootService) => RootService.getUser(),
          // project: (SettingsService) => SettingsService.getProject(),
          // allConnections: (RootService) => RootService.getConnections(),
          // hashtags: (RootService) => RootService.getHashtags(),
          // commonTags: (RootService) => RootService.getCommonHashtags()
        },
        component: 'app',
      });
  })
  .name;
