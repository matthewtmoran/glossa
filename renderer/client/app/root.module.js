import angular from 'angular';
import uiRouter from '@uirouter/angularjs';
import ngAria from 'angular-aria';
import ngAnimate from 'angular-animate';
import ngSanitize from 'angular-sanitize';
import mdDataTable from 'angular-material-data-table';
import * as _ from "lodash"
import ngMaterial from 'angular-material';
import ngFileUpload from 'ng-file-upload';
import CodeMirror from 'codemirror';
import ngCodeMirror from 'ngCodemirror'
import {rootComponent} from './root.component';
import {common} from './common/common.module';
import {RootService} from './root.service';
import {NotificationService} from './components/notification/notification.service';
import {components} from './components/components.module';
import './root.scss';
import 'angular-material/angular-material.scss';

const electron = window.require('electron');
var ipcRenderer = window.require('electron').ipcRenderer;
var shell = window.require('electron').shell;
//open links externally by default

//TODO: figure out how to make this shit modular and WORK
angular.module('config', []);
//needed for ui-codemirror not sure this is the best way to bind to window objet
window.CodeMirror = CodeMirror;

//when the window load, call project data then bootstrap the angular application once promise resolves.
window.onload = () => {
  let initInector = angular.injector(['ng']);
  let $http = initInector.get('$http');
  let $timeout = initInector.get('$timeout');
  let $animate = initInector.get('$animate');

  $http({
    url: 'http://localhost:9000/api/preload',
    method: 'GET'
  }).then((res) => {
    const appData = {};
    appData.initialState = res.data;
    appData.isWindows = window.process.platform === 'win32';
    angular.module('config').constant('__appData', appData);
    //bootstrap angular
    angular.bootstrap(document, [root]);
  }).catch((err) => {
    console.log('preload data failed', err);
  });

  //handles click events on links that should open with default browser
  angular.element(document).on('click', 'a[href^="http"]', (event) => {
    event.preventDefault();
    shell.openExternal(this.href);
  });


  //let the server know the window has loaded.
  ipcRenderer.send('window:loaded', {});

};

//Not sure this only works if config is a string.  As a variable, it was failing hard.
//     SimpleMDE,
// 'ngSimple',
export const root = angular
  .module('root', [
    'config',
    'ui.codemirror',
    mdDataTable,
    ngAria,
    ngSanitize,
    ngAnimate,
    ngMaterial,
    uiRouter,
    ngFileUpload,
    common,
    components,
  ])
  .component('root', rootComponent)
  .service('RootService', RootService)
  .service('NotificationService', NotificationService)
  .config(($locationProvider, $urlRouterProvider, $mdThemingProvider, $compileProvider, cfpLoadingBarProvider) => {
    'ngInject';
    $locationProvider.html5Mode(true);
    //material theme stuff...
    const customAccent = {
      '50': '#b80000',
      '100': '#d10000',
      '200': '#eb0000',
      '300': '#ff0505',
      '400': '#ff1f1f',
      '500': '#ff3838',
      '600': '#ff6b6b',
      '700': '#ff8585',
      '800': '#ff9e9e',
      '900': '#ffb8b8',
      'A100': '#ff6b6b',
      'A200': '#FF5252',
      'A400': '#ff3838',
      'A700': '#ffd1d1',
      'contrastDefaultColor': 'light'
    };
    const glossaPalette = {
      '50': 'E8E8E8',
      '100': 'C6C6C6',
      '200': 'A1A1A1',
      '300': '7B7B7B',
      '400': '5E5E5E',
      '500': '424242',
      '600': '3C3C3C',
      '700': '333333',
      '800': '2B2B2B',
      '900': '1D1D1D',
      'A100': '212121',
      'A200': 'FF5252',
      'A400': '212121',
      'A700': 'BDBDBD',
      'contrastDefaultColor': 'light',    // whether, by default, text         (contrast)
      // on this palette should be dark or light
      'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
        '200', '300', '400', 'A100'],
      'contrastLightColors': undefined    // could also specify this if default was 'dark'
    };
    $mdThemingProvider.definePalette('customAccent', customAccent);
    $mdThemingProvider.definePalette('glossaPalette', glossaPalette);

    $mdThemingProvider.theme('default')
      .primaryPalette('glossaPalette')
      .accentPalette('customAccent');

    //template for the loading spinner use material components
    cfpLoadingBarProvider.spinnerTemplate = `<md-progress-circular id="loading-spinner"  md-diameter="30"></md-progress-circular>`;
  })
  .run(($rootScope, $state, $injector, $window, RootService, $mdUtil, $compile, IpcSerivce, $transitions, __appData) => {
    'ngInject';

    if (__appData.initialState.session.currentState && __appData.initialState.session.currentState.length > 0) {
      $state.go(__appData.initialState.session.currentState);
    } else {
      $state.go('notebook');
    }

    $transitions.onStart({to: '*', from: '*'}, (trans) => {
      console.log('$transitions onStart');
      let toState = trans.$to();
      //This keeps the state from redirecting away from the child state when that same child state is clicked.
      let redirect = toState.redirectTo;
      if (redirect) {
        console.log('Redirect is happening');
        if (angular.isString(redirect)) {
          // event.preventDefault();
          $state.go(redirect, toState.params);
        }
        else {
          console.log('no redirect...');
          let newState = $injector.invoke(redirect, null, {toState: toState.name, toParams: toState.params});
          if (newState) {
            if (angular.isString(newState)) {
              console.log('going to newstate');
              $state.go(newState);
            }
            else if (newState.state) {
              // event.preventDefault();
              console.log('going to some other state');
              $state.go(toState.name, toState.params);
            }
          }
        }
      }
    });

    $transitions.onSuccess('*', (trans) => {
      let currentState = trans.router.stateService.current.name;
      let session = {
        currentState: currentState,
      };
      IpcSerivce.send('update:session', session);
    });

    $rootScope.$on('cfpLoadingBar:started', event => {
      $mdUtil.nextTick(() => $compile(angular.element($window.document.getElementById('loading-spinner')))($rootScope));
    });

  })
  .name;

