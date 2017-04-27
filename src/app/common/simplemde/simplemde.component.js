import SimpleMDE from 'simplemde';

export const simplemdeComponent = {
  bindings: {
    editorOptions: "=",
    updateFunction: "&",
    fileBinding: "=",
    valueBinding: "="
  },
  template:`<textarea ng-model=""></textarea>`,
  controller: class SimplemdeComponent {
    constructor($parse, $timeout) {
      'ngInject';

      // this.editor.on('change', this.changeEvent);
      //I have to watch for this blur event to make changes.
      // TODO:I dont like that this is called initially
      // this.editor.on('blur', this.blurEvent);

    }

    $onChanges(changes) {
      console.log('changes', changes);
      if (changes.valueBinding) {
        console.log('changes.valueBinding', changes.valueBinding);
      }
    }

    $onInit() {
      this.hashReg = new RegExp("(^|\s)(#[a-z\d-]+)", "i");
      this.options = {};
      // this.options = this.$parse(attrs.simplemde)(scope) || {};
      this.options.element = element[0];
      this.mde = new SimpleMDE(this.options);
      this.cm = this.mde.myCodeMirror;
      this.editor = this.mde.codemirror;
      this.hashtagList = [];
    }

    render() {
      let val = ctrl.ngModel.$modelValue || options["default"];
      //val is undefined if there is no description leaving simplemde/codemirror value keep the previous value.
      if (!val) {
        val = '';
      }
      //I put a delay on this because in dialogs, it does not show content, and If it is any less than 300 the cursor is misplaced
      this.$timeout(() => {
        this.mde.value(val);
      }, 300);

      if (this.mde.isPreviewActive()) {
        this.rerenderPreview(val);
      }
    };

    blurEvent(val) {

      // ctrl.parent.update();
    };

    //runs everytime there is a change in a simplmde instance
    changeEvent(instance, object) {
      scope.$applyAsync(() => {
        // ctrl.ngModel.$setViewValue(mde.value());
      });
      this.showHashtagHints(instance, object);
    };

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

    //just a gets all the tags and return promise.
    getAllTags() {
      // return HashtagService.getHashtags().then(function (data) {
      //   return data
      // });
    }

    //I'm not sure we will use wave-preview at all
    rerenderPreview(val) {
      console.log("rendering wave-preview");
    };


    // ctrl.ngModel.$render = this.render;

    // scope.simplemde = {
    //   instance: mde,
    //   rerenderPreview: this.rerenderPreview
    // };

  }


}