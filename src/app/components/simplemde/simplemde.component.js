import SimpleMDE from 'simplemde';
import templateUrl from './simplemde.html';

export const simplemdeComponent = {
  bindings: {
    editorOptions: "<",
    fileBinding: "<",
    valueBinding: "<",
    hashtags: '<',
    updateFunction: "&",
    updateModel: '&'
  },
  transclude: true,
  templateUrl: templateUrl,
  controller: class SimplemdeComponent {
    constructor($parse, $timeout, $element) {
      'ngInject';
      this.$timeout = $timeout;
      this.$element = $element;
    }

    $onChanges(changes) {
      if (changes.editorOptions) {
        this.editorOptions = angular.copy(changes.editorOptions.currentValue);
        this.editorOptions.element = this.$element.find('textarea')[0]; //set the element to this instance. prevents issues with dialogs / multiple simplmde instances on a single page
      }
      if (changes.fileBinding) {
        this.fileBinding = angular.copy(changes.fileBinding.currentValue);
      }
      if (changes.hashtags) {
        this.hashtags = angular.copy(changes.hashtags.currentValue);
      }
      if (changes.valueBinding) {
        this.valueBinding = angular.copy(changes.valueBinding.currentValue);
      }
      if (changes.valueBinding && !changes.valueBinding.isFirstChange()) {
        this.render(this.valueBinding.description);
      }

    }

    $onInit() {
      this.isLoading = true;
      this.hashReg = new RegExp("(^|\s)(#[a-z\d-]+)", "i");
      this.hashtagList = this.hashtags.map((tag) => {
        tag.displayText = tag.tag;
        tag.text = tag.tag;
        return tag;
      });

      //timeout here so angular digest cycle is valid
      this.$timeout(() => {
        this.mde = new SimpleMDE(this.editorOptions);
        this.cm = this.mde.myCodeMirror;
        this.editor = this.mde.codemirror;

        this.editor.on('change', this.changeEvent.bind(this));
        this.editor.on('blur', this.blurEvent.bind(this));
        this.render(this.valueBinding.description);
      });
    }


    render(val) {
      if (!val) {
        val = '';
      }
      this.mde.value(val);
      if (this.editorOptions.autoPreview) {
        this.mde.togglePreview();
      }
      if (this.mde.isPreviewActive()) {
        this.rerenderPreview(val);
      }
      this.isLoading = false;
    }

    blurEvent() {
      if (!!this.updateFunction) {
        this.updateFunction({
          $event: {
            value: this.mde.value()
          }
        })
      }
    }

    changeEvent(instance, object) {
      this.updateModel({
        $event: {
          value: this.mde.value()
        }
      });
      this.showHashtagHints(instance, object);
    }



    //hashtags and hints
    showHashtagHints(instance, object) {
      let cursor = instance.getCursor();
      let currentLine = instance.getLine(cursor.line);
      let start = cursor.ch;
      let end = start;
      while (end < currentLine.length && /[\w#]+/.test(currentLine.charAt(end))) ++end;
      while (start && /[\w#]+/.test(currentLine.charAt(start - 1))) --start;
      let curWord = start != end && currentLine.slice(start, end);

      //if it's a hashtag this gets called
      if (this.hashReg.test(curWord)) {
        //I'm binding the list here and passing it to codemirror
        instance.list = this.hashtagList;
        //calls this custom function that's defined in codemirror.  Definitley need that option otherwise we will end up in an endless loop

        this.cm.showHint(instance, this.cm.hint.customList, {
          "completeSingle": false,
          'closeOnUnfocus': false
        })
      }
    };

    //I'm not sure we will use wave-preview at all
    rerenderPreview(val) {
      console.log("rendering wave-preview");
    };

    rerenderPreview() {

    }
  }


}