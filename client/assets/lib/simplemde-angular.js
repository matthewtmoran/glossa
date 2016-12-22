angular.module('simplemde', [])
    .directive('simplemde', [
        '$parse', '$timeout', 'simpleParse', '$q', 'hashtagSrvc', function ($parse, $timeout, simpleParse, $q, hashtagSrvc) {
            return {
                restrict: 'A',
                require: 'ngModel',
                // controller: ['$scope', function ($scope, hashtagSrvc, $q, simpleParse, fileSrvc) {
                //
                //     return {
                //         get: function () {
                //             return $scope.simplemde.instance;
                //         },
                //         rerenderPreview: function (val) {
                //             return $scope.simplemde.rerenderPreview(val);
                //         }
                //     };
                // }],
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



                    //TODO: I don't like query every instance of simplmde
                    //Get all tags an map each one to have the required field 'text'
                    getAllTags().then(function (result) {
                        if (!result.success) {
                            return console.log(result);
                        }
                        //Modify the tags to what codemirror's hints require
                        hashtagList = result.data.map(function (tag) {
                            tag.displayText = tag.tag;
                            tag.text = tag.tag;
                            return tag;
                        });
                    });



                    ngModel.$render = render;
                    editor.on('change', changeEvent);
                    //I have to watch for this blur event to make changes.
                    // TODO:I dont like that this is called initially
                    editor.on('blur', blueEvent);



                    //basic rendering of data from model value
                    function render() {
                        var val = ngModel.$modelValue || options["default"];
                        //val is undefined if there is no description leaving simplemde/codemirror value keep the previous value.
                        if (!val) {
                            val = '';
                        }
                        mde.value(val);
                        if (mde.isPreviewActive()) {
                            rerenderPreview(val);
                        }
                    }

                    //This is watched to update meta tab data
                    function blueEvent() {
                        if (!!options.updateFunction) {
                            //I binded this function to options so I would have access to it here.
                            options.updateFunction();
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
                        return hashtagSrvc.get().then(function (result) {
                            return result
                        });
                    }

                    //I'm not sure we will use preview at all
                    function rerenderPreview(val) {
                        console.log("rendering preview");
                    }

                    scope.simplemde = {
                        instance: mde,
                        rerenderPreview: rerenderPreview
                    };
                }
            };
        }
    ]);
