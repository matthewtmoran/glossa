'use strict';

angular.module('glossa')
    .component('baselineComponent', {
        controller: baselineCtrl,
        controllerAs: 'blVm',
        templateUrl: 'app/baseline/baseline.component.html',
        transclude: true,
        bindings: {
            currentFile: '=',
            notebookAttachment: '=',
            markdownFiles: '='
        },
        require: {
            parent: '^^corpusComponent'
        }
    });
// On enter
//
function baselineCtrl($scope, baselineSrvc, NotebookService, $timeout) {
    var blVm = this;

    var isDoubleClick = false;
    var singleClick;

    blVm.textContent = '';

    blVm.$onInit = init;
    blVm.codemirrorLoaded = codemirrorLoaded;
    blVm.update = update;

    $scope.$watch('blVm.currentFile', function(newValue) {
        blVm.audioPath = '';
        blVm.imagePath = '';
        if (newValue) {
            getMediaData(newValue)
        }
    });


    function init() {

        // getMediaData(blVm.currentFile)


    }

    function getMediaData(file) {
        if (file.notebookId) {
            NotebookService.findNotebook(file.notebookId).then(function(notebook) {
                blVm.audioPath = notebook.audio.path ||'';
                blVm.imagePath = notebook.image.path ||'';
            });
            return;
        }
        if (blVm.currentFile.audio) {
            blVm.audioPath = blVm.currentFile.audio.path || null;
        }

        if (blVm.currentFile.image) {
            blVm.imagePath = blVm.currentFile.image.path || null;
        }
    }

    function update() {
        baselineSrvc.updateContent(blVm.currentFile, blVm.textContent);
    }


    function getTextContent(file) {
        baselineSrvc.readContent(file, function(result) {
            blVm.textContent = result;
            $scope.$apply();
        });
    }

    function getAudioImagePath() {
        if (blVm.currentFile.audio) {
            blVm.audioPath = path.join(globalPaths.static.trueRoot, blVm.currentFile.audio.path)
        }
        if (blVm.currentFile.image) {
            blVm.imagePath = path.join(globalPaths.static.trueRoot, blVm.currentFile.image.path)
        }
    }


    var _doc;


    function codemirrorLoaded(_editor) {
        _doc = _editor.getDoc();

        _editor.setOption('lineNumbers', true);

        _editor.setOption('extraKeys', {
            Enter: enterEvent
        });

        _editor.on('keypress', function(instance, event) {
            // console.log('keypress');
        });


        timestampOverlay(_editor);

        function hoverWidgetOnOverlay(cm, overlayClass) {
            // cm.getWrapperElement().addEventListener('mousehover', function(e) {
            //     var onToken = e.target.classList.contains("cm-"+overlayClass);
            //     if (onToken) {
            //         e.target.
            //     }
            //
            // }


            cm.getWrapperElement().addEventListener('mousedown', function(e) {
                var onToken = e.target.classList.contains("cm-"+overlayClass);
                var tokenText = e.target.innerText;

                var time_rx = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])\.([0-9])/g;


                // cm.getRange(word.anchor, word.head);

                if (onToken) {

                    var dateUnformatted = tokenText.match(time_rx);

                    var dateFormatted = convertToSeconds(dateUnformatted[0]);



                    // cm.execCommand('goLineDown');
                    // _doc.goLineDown();


                    $scope.$broadcast('set:timeStamp', dateFormatted);

                }
            });
        }

        function timestampOverlay(cm) {
            if (!cm) return;

            var rx_word = "\" "; // Define what separates a word

            function isTimeStamp(s) {
               var comment =  /<!--.*?-->/;
                if (!comment.test(s)) {
                    return false;
                } else if (comment.test(s)) {
                    return true;
                }
            }

            cm.addOverlay({
                    token: function(stream) {
                        var ch = stream.peek();
                        var word = "";

                        if (rx_word.includes(ch) || ch==='\uE000' || ch==='\uE001') {
                            stream.next();
                            return null;
                        }

                        while ((ch = stream.peek()) && !rx_word.includes(ch)) {
                            word += ch;
                            stream.next();
                        }

                        if (isTimeStamp(word)) return "timestamp"; // CSS class: cm-timestamp
                    }},
                    { opaque : true }  // opaque will remove any spelling overlay etc
            );


            hoverWidgetOnOverlay(cm, 'timestamp');
        }


    }



    function enterEvent(cm) {
        var doc = cm.getDoc();
        if(!isDoubleClick) {
            isDoubleClick = true;
            press();
        } else {
            doublePress();
        }
        function press() {
            singleClick = $timeout(function() {
                doc.replaceSelection("\n" ,"end");
                isDoubleClick = false;
            }, 250)
        }

        function doublePress() {
            $timeout.cancel(singleClick);

            $scope.$broadcast('get:timeStamp');


            isDoubleClick = false;
        }
    }

    $scope.$on('send:timeStamp', function(event, seconds) {
        console.log('send:timestamp listener', seconds);

        var string = " <!--" + clockFormat(seconds, 1) + "--> ";

        _doc.replaceSelection(string, 'end');

    });


    function convertToSeconds(time) {


        var a = time.split(':'); // split it at the colons

// minutes are worth 60 seconds. Hours are worth 60 minutes.
        var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
        return seconds;
    }



   function formatTime (time) {
        console.log('time***', time);

        var sec_num = parseInt(time, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    }

    //takes seconds and then decimals....
    function clockFormat(seconds, decimals) {
        var hours,
            minutes,
            secs,
            result;

        hours = parseInt(seconds / 3600, 10) % 24;
        minutes = parseInt(seconds / 60, 10) % 60;
        secs = seconds % 60;
        secs = secs.toFixed(decimals);

        result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs < 10 ? "0" + secs : secs);

        return result;
    }

    function cueFormatters(format) {

        function clockFormat(seconds, decimals) {
            var hours,
                minutes,
                secs,
                result;

            hours = parseInt(seconds / 3600, 10) % 24;
            minutes = parseInt(seconds / 60, 10) % 60;
            secs = seconds % 60;
            secs = secs.toFixed(decimals);

            result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs < 10 ? "0" + secs : secs);

            return result;
        }

        var formats = {
            "seconds": function (seconds) {
                return seconds.toFixed(0);
            },
            "thousandths": function (seconds) {
                return seconds.toFixed(3);
            },
            "hh:mm:ss": function (seconds) {
                return clockFormat(seconds, 0);
            },
            "hh:mm:ss.u": function (seconds) {
                return clockFormat(seconds, 1);
            },
            "hh:mm:ss.uu": function (seconds) {
                return clockFormat(seconds, 2);
            },
            "hh:mm:ss.uuu": function (seconds) {
                return clockFormat(seconds, 3);
            }
        };

        return formats[format];
    }
}

