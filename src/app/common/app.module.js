import uiRouter from 'angular-ui-router';
import { appComponent } from './app.component';
import { ParseService } from './parse/parse.service';
// import { attachmentComponent } from './dialog/dialog-attahcment/dialog-attachment.controller';
import { appNav } from './app-nav/app-nav.module';
import { appDrawer } from './app-drawer/app-drawer.module';
import { appSidebar } from './app-sidebar/app-sidebar.module';
import { waveSurfer } from './wavesurfer/wavesurfer.module';
import { dialogs } from './dialog/dialog.module';

import {simplemdeComponent} from './simplemde/simplemde.component';

import './app.scss';

  // .component('attachmentComponent', attachmentComponent)
export const app = angular
  .module('common.app', [
    uiRouter,
    appNav,
    appSidebar,
    appDrawer,
    waveSurfer,
    dialogs
  ])
  .component('app', appComponent)
  .component('simplemdeComponent', simplemdeComponent)
  .service('ParseService', ParseService)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('app', {
        redirectTo: 'corpus',
        url: '/app',
        data: {
          requiredAuth: false,
        },
        component: 'app',
      });
  })
  .name;
