//TODO: make this into a component
import SimpleMDE from 'simplemde';
export class SimplemdeDirective {
  constructor($parse, $timeout) {
    'ngInject';

    this.restrict = 'A';
    this.require = {
      ngModel: 'ngModel',
    };
    // this.scope ={
    //   updateFunction: '&'
    // };
    this.$parse = $parse;
    this.$timeout = $timeout;
  }

  link(scope, element, attrs, ctrl) {

    const hashReg = new RegExp("(^|\s)(#[a-z\d-]+)", "i");
    let options;
    options = this.$parse(attrs.simplemde)(scope) || {};
    options.element = element[0];
    let mde = new SimpleMDE(options);
    let cm = mde.myCodeMirror;
    let editor = mde.codemirror;
    let hashtagList = [];

    //This is the actual instance that we can use to call
    //this is the specific instance - much more limited

    //I set the editor because, I need to refresh it some times and this was a quick little way to have access though I'm sure there is a better way
    // simpleSrvc.setEditor(editor);


    //TODO: I don't like query every instance of simplmde
    //Get all tags an map each one to have the required field 'text'
    // getAllTags()
    //   .then(function (data) {
    //     //Modify the tags to what codemirror's hints require
    //     hashtagList = data.map(function (tag) {
    //       tag.displayText = tag.tag;
    //       tag.text = tag.tag;
    //       return tag;
    //     });
    //
    //   }).catch(function (err) {
    //   console.log('there was an error querying hashtagas', err);
    // });


    //I have to watch for this blur event to make changes.
    // TODO:I dont like that this is called initially

    //basic rendering of data from model value
    this.render = () => {
      let val = ctrl.ngModel.$modelValue || options["default"];
      //val is undefined if there is no description leaving simplemde/codemirror value keep the previous value.
      if (!val) {
        val = '';
      }
      //I put a delay on this because in dialogs, it does not show content, and If it is any less than 300 the cursor is misplaced
      this.$timeout(() => {
        mde.value(val);
      }, 300);

      if (mde.isPreviewActive()) {
        this.rerenderPreview(val);
      }
    };

    //This is watched to update meta tab data
    this.blurEvent = (val) => {
      if (!!options.updateFunction) {
        options.updateFunction();
      }
    };

    //runs everytime there is a change in a simplmde instance
    this.changeEvent = (instance, object) => {
      scope.$applyAsync(() => {
        ctrl.ngModel.$setViewValue(mde.value());
      });
      this.showHashtagHints(instance, object);
    };

    //hashtags and hints
    this.showHashtagHints = (instance, object) => {
      let cursor = instance.getCursor();
      let currentLine = instance.getLine(cursor.line);
      let start = cursor.ch;
      let end = start;
      while (end < currentLine.length && /[\w#]+/.test(currentLine.charAt(end))) ++end;
      while (start && /[\w#]+/.test(currentLine.charAt(start - 1))) --start;
      let curWord = start != end && currentLine.slice(start, end);

      //if it's a hashtag this gets called
      if (hashReg.test(curWord)) {
        //I'm binding the list here and passing it to codemirror
        instance.list = hashtagList;
        //calls this custom function that's defined in codemirror.  Definitley need that option otherwise we will end up in an endless loop

        cm.showHint(instance, cm.hint.customList, {
          "completeSingle": false,
          'closeOnUnfocus': false
        })
      }
    };

    //just a gets all the tags and return promise.
    function getAllTags() {
      // return HashtagService.getHashtags().then(function (data) {
      //   return data
      // });
    }

    //I'm not sure we will use wave-preview at all
    this.rerenderPreview = (val) => {
      console.log("rendering wave-preview");
    };

    editor.on('change', this.changeEvent);
    //I have to watch for this blur event to make changes.
    // TODO:I dont like that this is called initially
    editor.on('blur', this.blurEvent);

    ctrl.ngModel.$render = this.render;

    scope.simplemde = {
      instance: mde,
      rerenderPreview: this.rerenderPreview
    };

  }
}
