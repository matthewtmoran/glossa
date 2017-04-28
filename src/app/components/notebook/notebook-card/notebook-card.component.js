import SimpleMDE from 'simplemde';
import  templateUrl from './notebook-card.html';

export const notebookCardComponent = {
  bindings: {
    notebook: '<',
    onViewDetails: '&',
    onDisconnectNotebook: '&',
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

    $onChanges() {
      this.previewText = this.$sce.trustAsHtml(SimpleMDE.markdown(this.notebook.description));

      if (this.notebook.isNew) {
        this.$element.addClass('new-data');
        this.$timeout(() => {
          this.$element.removeClass('new-data');
        }, 5000)
      }

      if (this.$state.current.name.indexOf('corpus') > -1) {
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

    disconnectNotebook() {
      this.onDisconnectNotebook({
        $event: {
          notebook: this.notebook
        }
      })
    }

  }
};