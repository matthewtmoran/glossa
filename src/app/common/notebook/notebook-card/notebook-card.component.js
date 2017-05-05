import SimpleMDE from 'simplemde';
import  templateUrl from './notebook-card.html';

    // isCorpus: '<',
export const notebookCardComponent = {
  bindings: {
    notebook: '<',
    currentUser: '<',
    onViewDetails: '&',
    onViewPreview: '&',
    onDisconnectNotebook: '&'
  },
  templateUrl,
  controller: class NotebookCardComponent {
    constructor($element, $timeout, $sce, $state) {
      'ngInject';
      this.$element = $element;
      this.$timeout = $timeout;
      this.$sce = $sce;
      this.$state = $state;

      this.isCorpus = false;
      // console.log('SimpleMDE.markdown', SimpleMDE.markdown);

    }

    $onChanges(changes) {
      console.log('$onChanges in notebook-card.component', changes);
      if (changes.notebook) {
        console.log("changes in notebook");
        this.notebook = angular.copy(changes.notebook.currentValue);
        this.renderNotebookPreview();
      }
      if (changes.currentUser) {
        console.log("changes in currentUser");
        this.currentUser = angular.copy(changes.currentUser.currentValue);
      }
    }

    renderNotebookPreview() {
      console.log('this.notebook.description', this.notebook.description);
      this.previewText = this.$sce.trustAsHtml(SimpleMDE.markdown(this.notebook.description));

      if (this.notebook.isNew) {
        this.$element.addClass('new-data');
        this.$timeout(() => {
          this.$element.removeClass('new-data');
        }, 5000)
      }
      if (this.$state.current.parent.indexOf('corpus') > -1) {
        this.isCorpus = true;
      }
    }

    viewDetails() {
      this.onViewDetails({
        $event: {
          notebook: this.notebook
        }
      })
    }

    viewPreview() {
      this.onViewPreview({
        $event: {
          notebook: this.notebook
        }
      })
    }

    disconnectNotebook() {
      this.onDisconnectNotebook()
    }

  }
};