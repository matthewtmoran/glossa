import templateUrl from './basic-audio-preview.html';

export const basicAudioPreviewComponent = {
  bindings: {
    urlSrc: '<'
  },
  templateUrl,
  controller: class BasicAudioPreviewComponent {
    constructor($element, $scope) {
      'ngInject';
      this.$element = $element;
      this.$scope = $scope;

    }

    $onInit() {
      // this.timelineWidth = angular.element(this.$element[0].querySelector(".progress"))[0].offsetWidth;

      //TODO: need to fix this...
      setTimeout(() => {
        this.timelineWidth = this.$element[0].querySelectorAll(".progress")[0].offsetWidth;
      }, 1000);

      this.barstyle = {width: "0%"};
      this.duration = '0:00';
      this.audio = new Audio();
      this.audio.type = "audio/mpeg";
      this.audio.src = this.urlSrc;
      this.isPlaying = false;
      this.audio.addEventListener('timeupdate', this.timeupdate.bind(this));
    }

    $onDestroy() {

      if (this.isPlaying) {
        this.playAudio();
      }
      // this.audio = null;
      // this.audio.removeAllListeners();
    }

    reset() {
      this.audio.addEventListener('timeupdate', this.timeupdate.bind(this));
    }


    setTime(event) {
      this.moveplayhead(event);
      this.audio.currentTime = this.audio.duration * this.clickPercent(event);
      // remove listener on audio
      this.audio.removeEventListener('timeupdate', this.timeupdate, true);

    };

    moveplayhead(event) {
      let newMargLeft = event.clientX - this.getPosition(event.target);

      if (newMargLeft === 0 && newMargLeft === this.timelineWidth) {
        this.barstyle.marginLeft = newMargLeft + "px";
      }
      if (newMargLeft ===  0) {
        this.barstyle.marginLeft = "0px";
      }
      if (newMargLeft === this.timelineWidth) {
        this.barstyle.marginLeft = this.timelineWidth + "px";
      }
    }


    timeupdate() {
      let sec_num = this.audio.currentTime;
      let minutes = Math.floor(sec_num / 60);
      let seconds = sec_num - (minutes * 60);
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      minutes += "";
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      seconds += "";

      let time = minutes + ':' + seconds.substring(0, 2);
      this.duration = time;

      this.barstyle.width = (this.audio.currentTime / this.audio.duration) * 100 + "%";
      this.$scope.$apply();
    };

    clickPercent(event) {
      return (event.clientX - this.getPosition(event.target)) / this.timelineWidth;
    }

    getPosition(el) {
      return el.getBoundingClientRect().left;
    }


    playAudio() {
      if (this.isPlaying) {
        this.audio.pause();
        this.isPlaying = false;
      } else {
        this.audio.play();
        this.isPlaying = true;
      }
    }


  }
};