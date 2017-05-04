import SimpleMDE from 'simplemde';
import  templateUrl from './notebook-card.html';

    // isCorpus: '<',
export const notebookCardComponent = {
  bindings: {
    notebook: '<',
    onViewDetails: '&',
    onViewPreview: '&',
    onDisconnectNotebook: '&',
    currentUser: '<'
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
      console.log('$onChanges in notebook-card');
      this.previewText = this.$sce.trustAsHtml(SimpleMDE.markdown(this.notebook.description));

      if (this.notebook.isNew) {
        this.$element.addClass('new-data');
        this.$timeout(() => {
          this.$element.removeClass('new-data');
        }, 5000)
      }
      console.log('this.$state', this.$state);
      if (this.$state.current.parent.indexOf('corpus') > -1) {
        console.log('corpus is true');
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
      console.log('disconnectNotebook in notebook-card');
      this.onDisconnectNotebook()
    }

  }
};