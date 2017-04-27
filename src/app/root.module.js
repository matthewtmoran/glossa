import angular from 'angular';
import uiRouter from 'angular-ui-router';
import ngAria from 'angular-aria';
import ngAnimate from 'angular-animate';
import ngMaterial from 'angular-material';
import ngFileUpload from 'ng-file-upload';
import CodeMirror from 'codemirror';

import ngCodeMirror from 'ngCodemirror'


// import * as SimpleMDE from 'simplemde/src/js/simplemde';
import { rootComponent } from './root.component';
import { common } from './common/common.module';
import { RootService } from './root.service';
import { SocketService } from './common/socket/socket.service';
import { NotificationService } from './common/notification/notification.service';
// import { config } from '../config';
import { components } from './components/components.module';
import './root.scss';
import 'angular-material/angular-material.scss';

//TODO: figure out how to make this shit modular and WORK
angular.module('config', []);
//needed for ui-codemirror not sure this is the best way to bind to window objet
window.CodeMirror = CodeMirror;
//when the window load, call project data then bootstrap the angular application once promise resolves.
window.onload = () => {
  const rootUrl = 'http://localhost:9000/';
  let initInjector = angular.injector(['ng']);
  let $http = initInjector.get('$http');
  let $timeout = initInjector.get('$timeout');
  let $animate = initInjector.get('$animate');

  $http({
    url : `${rootUrl}api/user`,
    method : 'GET'
  }).then((res) => {
    //define some constant that we can inject through the application.
      angular.module('config').constant('__user', res.data);
      angular.module('config').constant('__rootUrl', rootUrl);
    })
    .catch((res) => {
      console.log('error', res);
    }).then(() => {
      angular.bootstrap(document, [root]);
    });
};
//Not sure this only works if config is a string.  As a variable, it was failing hard.
//     SimpleMDE,
    // 'ngSimple',
export const root = angular
  .module('root', [
    'config',
    'ui.codemirror',
    ngAria,
    ngAnimate,
    ngMaterial,
    uiRouter,
    ngFileUpload,
    common,
    components,
  ])
  .component('root', rootComponent)
  .service('RootService', RootService)
  .service('SocketService', SocketService)
  .service('NotificationService', NotificationService)
  .config(($locationProvider, $urlRouterProvider, $mdThemingProvider) => {
    'ngInject';
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/app/corpus');

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
      '50': 'ffebee',
      '100': 'ffcdd2',
      '200': 'ef9a9a',
      '300': 'F5F5F5',
      '400': '9E9E9E',
      '500': '9E9E9E',
      '600': 'e53935',
      '700': 'd32f2f',
      '800': '616161',
      '900': 'b71c1c',
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

    // $mdIconProvider
    //   .defaultIconSet('../bower_components/material-design-icons/iconfont/MaterialIcons-Regular.svg', 24);

    $mdThemingProvider.theme('default')
      .primaryPalette('glossaPalette')
      .accentPalette('customAccent');


    // $urlRouterProvider.otherwise(function($injector, $location){
    //   var state = $injector.get('$state');
    //   state.go("corpus");
    // });
  })
  .run(($rootScope, $state, $injector, __user, $window, RootService, $transitions, SocketService) => {
    'ngInject';

    // console.log('going to state: ', __user.session.currentState);

    $state.go(__user.session.currentState, __user.session.currentStateParams);
  //   //if there is no $window.socket object and if the user has sharing enabled
    if (!$window.socket && __user.settings.isSharing) {
      SocketService.init();
      RootService.initListeners();
    }

    $transitions.onStart( {to: '*', from: '*' }, ($transitions) => {
      let toState = $transitions.$to();
      // let fromState = $transitions.$from();
      // transition.$to()


      __user.session.currentState = toState.name;
      __user.session.currentStateParams = toState.params;
      //update session data in persistent storage every state change
      //TODO: might just be able to use localstorage
      RootService.updateSession(__user.session).then((data) => {
        //update the __user object in memory
        __user.session = data.session;
      });

      //This keeps the state from redirecting away from the child state when that same child state is clicked.
      let redirect = toState.redirectTo;
      if (redirect) {
        console.log('Redirect is happening');
        if (angular.isString(redirect)) {
          // event.preventDefault();
          $state.go(redirect, toState.params);
        }
        else {
          let newState = $injector.invoke(redirect, null, {toState: toState.name, toParams: toState.params});
          if (newState) {
            if (angular.isString(newState)) {
              // event.preventDefault();
              $state.go(newState);
            }
            else if (newState.state) {
              // event.preventDefault();
              $state.go(toState.name, toState.params);
            }
          }
        }
      }
    });
  })
  .name;

// angular.bootstrap(document, [root]);