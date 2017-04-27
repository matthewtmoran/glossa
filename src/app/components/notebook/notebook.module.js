import { NotebookService } from './notebook.service';
import { notebookComponent } from './notebook.component';
import { notebookCard } from './notebook-card/notebook-card.module';
import './notebook.scss';

export const notebook = angular
  .module('components.notebook', [
    notebookCard
  ])
  .component('notebook', notebookComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider
      .state('notebook', {
        parent: 'app',
        url: '/notebook',
        // abstract: true,
        component: 'notebook',
        params: {
          user: {},
          corpus: 'default'
        },
        resolve: {
          currentState: ($transition$) => {
            // return $transition$.
          }
        }
      })
  })
  .service('NotebookService', NotebookService)
  .name;
