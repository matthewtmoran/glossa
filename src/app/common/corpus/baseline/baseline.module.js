import uiRouter from '@uirouter/angularjs';
import {baselineComponent} from './baseline.component';
import './baseline.scss';

export const baseline = angular
  .module('components.corpus.baseline', [
    uiRouter,
  ])
  .component('baseline', baselineComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('baseline', {
        parent: 'corpus',
        url: '/baseline',
        component: 'baseline',
        params: {
          fileId: ''
        },
        resolve: {
          selectedFile: function ($transition$, markDownFiles) {
            return markDownFiles.find(selectedFile => selectedFile._id == $transition$.params().fileId);
          }
        },
      });
  })
  .name;
