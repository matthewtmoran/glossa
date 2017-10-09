import templateUrl from './notebook-dialog-normal.html';
import { NotebookDialogController } from './notebook-dialog-controller'


export const notebookDialogComponent = {
  bindings: {
    allConnections: '<',
    notebooksData: '<',
    searchText: '<',
    currentUser: '<',
    hashtags: '<',
    notebook: '<',
    settings: '<',
    editorOptions:'<',
    onUpdateTag: '&'
  },
  transclude: true,
  templateUrl,
  controller: NotebookDialogController
};