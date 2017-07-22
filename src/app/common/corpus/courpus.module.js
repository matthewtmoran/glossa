import { CorpusService } from './corpus.service';
import {meta} from './meta/meta.module';
import {baseline} from './baseline/baseline.module';
import {corpusSidebar} from './corpus-sidebar/corpus-sidebar.module';
import {corpusComponent} from './corpus.component';
import {SelectTabIndex} from './tab-index/tab-index.directive';
import './corpus.scss';

export const corpus = angular
  .module('components.corpus', [
    meta,
    baseline,
    corpusSidebar
  ])
  .component('corpus', corpusComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('corpus', {
        parent: 'app',
        url: '/corpus',
        // abstract: true,
        // redirectTo:'meta',
        component: 'corpus',
        params: {
          user: {},
          corpus: 'default'
        },
        resolve: {
          markDownFiles: (CorpusService, $stateParams) => {
            return CorpusService.getFiles($stateParams.corpus)
          },
          currentState: ($transition$) => {
            // return $transition$.
          }
         }
      })
  })
  .service('CorpusService', CorpusService)
  .directive('selectTabIndex', ['$timeout', '$state', ($timeout, $state) => new SelectTabIndex($timeout, $state)])
  .name;
