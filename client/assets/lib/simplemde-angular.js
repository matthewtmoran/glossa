angular.module('simplemde', [])
    .directive('simplemde', [
        '$parse', '$timeout', 'simpleParse', '$q', 'HashtagService', 'simpleSrvc', function ($parse, $timeout, simpleParse, $q, HashtagService, simpleSrvc) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function (scope, element, attrs, ngModel) {
                    var options;
                    var hashReg = new RegExp("(^|\s)(#[a-z\d-]+)", "i");
                    var hashtagList = [];
                    options = $parse(attrs.simplemde)(scope) || {};

                    options.element = element[0];
                    var mde = new SimpleMDE(options);
                    //This is the actual instance that we can use to call
                    var cm = mde.myCodeMirror;
                    //this is the specific instance - much more limited
                    var editor = mde.codemirror;

                    //I set the editor because, I need to refresh it some times and this was a quick little way to have access though I'm sure there is a better way
                    // simpleSrvc.setEditor(editor);


                    //TODO: I don't like query every instance of simplmde
                    //Get all tags an map each one to have the required field 'text'
                    getAllTags().then(function (data) {
                        //Modify the tags to what codemirror's hints require
                        hashtagList = data.map(function (tag) {
                            tag.displayText = tag.tag;
                            tag.text = tag.tag;
                            return tag;
                        });

                    }).catch(function(err) {
                        console.log('there was an error querying hashtagas', err);
                    });

                    ngModel.$render = render;
                    editor.on('change', changeEvent);
                    //I have to watch for this blur event to make changes.
                    // TODO:I dont like that this is called initially
                    editor.on('blur', blurEvent);

                    //basic rendering of data from model value
                    function render() {
                        var val = ngModel.$modelValue || options["default"];
                        //val is undefined if there is no description leaving simplemde/codemirror value keep the previous value.
                        if (!val) {
                            val = '';
                        }
                        //I put a delay on this because in dialogs, it does not show content, and If it is any less than 300 the cursor is misplaced
                        $timeout(function(){
                            mde.value(val);
                        }, 300);

                        if (mde.isPreviewActive()) {
                            rerenderPreview(val);
                        }
                    }

                    //This is watched to update meta tab data
                    function blurEvent(val) {
                        //if there is an update function bound and if there is a file binding
                        if (!!options.updateFunction) {
                            //I binded this function to options so I would have access to it here.
                            options.updateFunction('description');
                        }
                    }

                    //runs everytime there is a change in a simplmde instance
                    function changeEvent(instance, object) {
                        scope.$applyAsync(function () {
                            ngModel.$setViewValue(mde.value());
                        });
                        showHashtagHints(instance, object);
                    }

                    //hashtags and hints
                    function showHashtagHints(instance, object) {
                        var cursor = instance.getCursor();
                        var currentLine = instance.getLine(cursor.line);
                        var start = cursor.ch;
                        var end = start;
                        while (end < currentLine.length && /[\w#]+/.test(currentLine.charAt(end))) ++end;
                        while (start && /[\w#]+/.test(currentLine.charAt(start - 1))) --start;
                        var curWord = start != end && currentLine.slice(start, end);

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
                    }

                    //just a gets all the tags and return promise.
                    function getAllTags() {
                        return HashtagService.getHashtags().then(function(data) {
                            return data
                        });
                    }

                    //I'm not sure we will use wave-preview at all
                    function rerenderPreview(val) {
                        console.log("rendering wave-preview");
                    }

                    scope.simplemde = {
                        instance: mde,
                        rerenderPreview: rerenderPreview
                    };
                }
            };
        }
    ]);
