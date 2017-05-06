import uiRouter from 'angular-ui-router';
import { appComponent } from './app.component';

// import { attachmentComponent } from './dialog/dialog-attahcment/dialog-attachment.controller';
import { appNav } from './app-nav/app-nav.module';
import { appDrawer } from './app-drawer/app-drawer.module';
import { appSidebar } from './app-sidebar/app-sidebar.module';
import { corpus } from './corpus/courpus.module'
import { notebook } from './notebook/notebook.module'
import { settings } from './settings/settings.module'

import './app.scss';

  // .component('attachmentComponent', attachmentComponent)
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
        redirectTo: 'corpus',
        url: '/app',
        data: {
          requiredAuth: false,
        },
        resolve: {
          // allConnections: (RootService) => {
          //   console.log('resolve in app.module');
          //   return RootService.getConnections()
          //     .then((data) => {
          //     console.log('data', data);
          //       return data;
          //     });
          // },
        },
        component: 'app',
      });
  })
  .name;
