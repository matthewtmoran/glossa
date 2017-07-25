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
      //TODO: should probably change data structure or hint source code
      this.hashtagList = this.hashtags.map((tag) => {
        tag.displayText = tag.tag;
        tag.text = tag.tag;
        return tag;
      });

      //timeout here so angular digest cycle is valid
      this.$timeout(() => {
        this.mde = new SimpleMDE(this.editorOptions);
        this.cm = this.mde.myCodeMirror; //should be codeMirror global object
        this.editor = this.mde.codemirror; //from text area codemirror object

        this.render(this.valueBinding.description);
        this.editor.on('change', this.changeEvent.bind(this));
        this.editor.on('blur', this.blurEvent.bind(this));


        this.cm.registerHelper('hint', 'hashtagHints', (editor) => {
          let cur = editor.getCursor(), curLine = editor.getLine(cur.line);
          let start = cur.ch, end = start;
          while (end < curLine.length && /[\w-#]+/.test(curLine.charAt(end))) ++end;
          while (start && /[\w-#]+/.test(curLine.charAt(start - 1))) --start;
          let curWord = start != end && curLine.slice(start, end); //this includes hash
          let tag;

          if (curWord) {
            tag = curWord.charAt(0) === '#' ? curWord.slice(1) : '';
          }
          let regex = new RegExp('^' + tag, 'i'); //this is just the word
          let result = {
            list: (!tag ? [] : this.hashtags.filter((item) => {
              if (!item.tagDescription) {
                item.tagDescription = '';
              }
             return item.tag.toLowerCase().indexOf(tag.toLowerCase()) > -1 || item.tagDescription.toLowerCase().indexOf(tag.toLowerCase()) > -1
            })).sort(),
            from: this.cm.Pos(cur.line, start),
            to: this.cm.Pos(cur.line, end)
          };
          if (result) {
            this.cm.on(result, "pick", (item) => {
              let lengthOfTag = {line:result.to.line, ch: item.tag.length + 1 }; //the length of the tag plus the # char
              editor.replaceRange('#' + item.tag + ' ', result.from, lengthOfTag); //replace the tag with the # char plus a space to close the hint
            });
          }
          return result;
        });
      });





    }

    //deals with displaying simplmde psuedo textarea
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

    //on blur data is saved as this function is passed down from parent components
    blurEvent() {
      if (!!this.updateFunction) {
        this.updateFunction({
          $event: {
            value: this.mde.value()
          }
        })
      }
    }

    //on every change we update the model manually and check for hashtags being typed
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
      console.log('this.editor.hasFocus()', this.editor.hasFocus());
      if (this.editor.hasFocus() && object.origin !== 'complete') {
        instance.showHint({ hint: this.cm.hint.hashtagHints, completeSingle: false, closeOnUnfocus: true });
      }




      // let cursor = instance.getCursor(); //gets the cursor
      // let currentLine = instance.getLine(cursor.line); //gets the line where the cursor is
      // let start = cursor.ch; //save the start of the cursor
      // let end = start; // start and end are the same
      //
      //
      // while (end < currentLine.length && /[\w#]+/.test(currentLine.charAt(end))) ++end;
      // while (start && /[\w#]+/.test(currentLine.charAt(start - 1))) --start;
      // let curWord = start !== end && currentLine.slice(start, end);
      //
      //
      // console.log('curWord:', curWord);


      // let regex = new RegExp('^' + curWord, 'i');
      //
      //
      //
      // let result = {
      //   list: (!curWord ? this.hashtagList : this.hashtagList.filter(function (item) {
      //     return item.match(regex);
      //   })).sort(),
      //   from: this.cm.Pos(cursor.line, start),
      //   to: this.cm.Pos(cursor.line, end)
      // };
      //
      // return result;


      //if it's a hashtag this gets called
      // if (this.hashReg.test(curWord)) {
      //   //I'm binding the list here and passing it to codemirror
      //   instance.list = this.hashtagList;
      //   //calls this custom function that's defined in codemirror.  Definitley need that option otherwise we will end up in an endless loop
      //
      //   this.cm.showHint(instance, this.cm.hint.customList, {
      //     "completeSingle": false,
      //     'closeOnUnfocus': true //
      //   })
      // }
    };

    //I'm not sure we will use wave-preview at all
    rerenderPreview(val) {
      console.log("rendering wave-preview");
    };

    rerenderPreview() {

    }
  }


}