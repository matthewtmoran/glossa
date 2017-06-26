import { NotebookService } from './notebook.service';
import { notebookComponent } from './notebook.component';
import { notebookCard } from './notebook-card/notebook-card.module';
import { notebookList } from './notebook-list/notebook-list.module';
import { notebookDialog } from './notebook-dialog/notebook-dialog.module';
import { notebookSidebar } from './notebook-sidebar/notebook-sidebar.module';
import { userList } from './user-list/user-list.module';
import { tagList } from './tag-list/tag-list.module';
import Exists from './notebook.filter';
import HashtagFilter from './hashtag-filter.filter';
import './notebook.scss';

export const notebook = angular
  .module('components.notebook', [
    notebookCard,
    notebookList,
    userList,
    tagList,
    notebookDialog,
    notebookSidebar
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
          },
          // notebooksData: NotebookService => NotebookService.getNotebooks()
        }
      })
  })
  .filter('exists', Exists)
  .filter('hashtagFilter', HashtagFilter)
  .service('NotebookService', NotebookService)
  .name;
