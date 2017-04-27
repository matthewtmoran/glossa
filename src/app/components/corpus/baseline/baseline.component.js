import templateUrl from './baseline.html';

export const baselineComponent = {
  bindings: {
    selectedFile: '<',
    notebookAttached: '<',
    onUpdate: '&'
  },
  templateUrl,
  controller: class BaselineComponent {
    constructor($scope, $timeout, NotebookService, cfpLoadingBar) {
      'ngInject';

      this.$timeout = $timeout;
      this.$scope = $scope;
      this.notebookService = NotebookService;
      this.cfpLoadingBar = cfpLoadingBar;

      this.doc = {};
      this.isDoubleClick = false;
      this.singleClick;


      this.codemirrorLoaded = this.codemirrorLoaded.bind(this);

      this.enterEvent = this.enterEvent.bind(this);
      this.clockFormat = this.clockFormat.bind(this);

      //TODO: refractor listener so service.......
      this.$scope.$on('send:timeStamp', this.insertTimestamp.bind(this))

    }

    $onChanges(changes) {
      if (changes.selectedFile) {
        this.currentFile = angular.copy(this.selectedFile);
        this.getMediaData(this.currentFile);
      }
    }

    codemirrorLoaded(_editor) {
      this._doc = _editor.getDoc();
      this.isDoubleClick = false;
      _editor.setOption('lineNumbers', true);
      _editor.setOption('extraKeys', {
        Enter: this.enterEvent
      });
      this.timestampOverlay(_editor);
    }

    // TODO: move to resolve
    getMediaData(file) {
      if (file.notebookId) {
        this.cfpLoadingBar.start();
        this.notebookService.findNotebook(file.notebookId)
          .then((notebook) => {
            this.audioPath = notebook.audio.path || '';
            this.imagePath = notebook.image.path || '';
            this.cfpLoadingBar.complete();
          });
      } else if (this.currentFile.audio || this.currentFile.image) {
        if (this.currentFile.audio) {
            this.audioPath = this.currentFile.audio.path || '';
        }
        if (this.currentFile.image) {
          this.imagePath = this.currentFile.image.path || '';
        }
      } else {
        this.audioPath = null;
        this.imagePath = null;
      }

    }

    hoverWidgetOnOverlay(cm, overlayClass) {
      cm.getWrapperElement().addEventListener('mousedown', (e) => {
        let onToken = e.target.classList.contains("cm-"+overlayClass);
        let tokenText = e.target.innerText;

        let time_rx = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])\.([0-9])/g;

        if (onToken) {
          let dateUnformatted = tokenText.match(time_rx);
          let dateFormatted = this.convertToSeconds(dateUnformatted[0]);

          this.$scope.$broadcast('set:timeStamp', dateFormatted);
        }
      });
    }

    timestampOverlay(cm) {
      if (!cm) return;
      let rx_word = "\" "; // Define what separates a word

      cm.addOverlay({
          token: (stream) => {
            let ch = stream.peek();
            let word = "";
            if (rx_word.includes(ch) || ch==='\uE000' || ch==='\uE001') {
              stream.next();
              return null;
            }
            while ((ch = stream.peek()) && !rx_word.includes(ch)) {
              word += ch;
              stream.next();
            }
            if (this.isTimeStamp(word)) return "timestamp"; // CSS class: cm-timestamp
          }},
        { opaque : true }  // opaque will remove any spelling overlay etc
      );

      this.hoverWidgetOnOverlay(cm, 'timestamp');
    }

    enterEvent(cm) {
      let doc = cm.getDoc();
      if(!this.isDoubleClick) {
        this.isDoubleClick = true;
        this.singleClick = this.$timeout(() => {
          doc.replaceSelection("\n" ,"end");
          this.isDoubleClick = false;
        }, 250)
      } else {
        this.$timeout.cancel(this.singleClick);
        this.$scope.$broadcast('get:timeStamp');
        this.isDoubleClick = false;
      }
    }

    insertTimestamp(event, seconds) {
      let string = " <!--" + this.clockFormat(seconds, 1) + "--> ";
      this._doc.replaceSelection(string, 'end');
    }

    saveContent() {
      this.onUpdate({$event: {file: this.currentFile}});
    }

    clockFormat(seconds, decimals) {
      let hours,
        minutes,
        secs,
        result;

      hours = parseInt(seconds / 3600, 10) % 24;
      minutes = parseInt(seconds / 60, 10) % 60;
      secs = seconds % 60;
      secs = secs.toFixed(decimals);

      result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs < 10 ? "0" + secs : secs);

      return result;
      //takes seconds and then decimals....
    }

    convertToSeconds(time) {
      let a = time.split(':'); // split it at the colons
      // minutes are worth 60 seconds. Hours are worth 60 minutes.
      let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
      return seconds;
    }

    isTimeStamp(s) {
      let comment =  /<!--.*?-->/;
      if (!comment.test(s)) {
        return false;
      } else if (comment.test(s)) {
        return true;
      }
    }

  },
};
