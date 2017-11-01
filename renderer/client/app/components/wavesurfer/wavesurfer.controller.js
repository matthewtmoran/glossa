import WaveSurfer from 'wavesurferDev';
// import WaveSurfer from 'wavesurfer.js';
export class WaveSurferController {
  constructor($timeout, $mdTheming, RootService, $interval, $scope, cfpLoadingBar, $element, $window) {
    'ngInject';

    this.$timeout = $timeout;
    this.$mdTheming = $mdTheming;
    this.rootService = RootService;
    this.$interval = $interval;
    this.$scope = $scope;
    this.cfpLoadingBar = cfpLoadingBar;
    this.$element = $element;
    this.$window = $window;

    // this.initWaveSurfer = this.initWaveSurfer.bind(this);
    this.setTimestamp = this.setTimestamp.bind(this);
    this.getTimestamp = this.getTimestamp.bind(this);

    this.$scope.$on('get:timeStamp', this.getTimestamp);
    this.$scope.$on('set:timeStamp', this.setTimestamp);
    this.$scope.$on('scrubRight', this.scrubForward.bind(this));
    this.$scope.$on('scrubLeft', this.scrubBackward.bind(this));
    this.$scope.$on('addTimeStamp', this.getTimestamp.bind(this));
    this.$scope.$on('adjustPlaySpeedUp', this.adjustPlaySpeedUp.bind(this));
    this.$scope.$on('adjustPlaySpeedDown', this.adjustPlaySpeedDown.bind(this));
    this.$scope.$on('playPause', this.playPause.bind(this));

    this.$onDestroy = () => {
      this.cfpLoadingBar.complete();
    }
  }

  stopInterval() {
    this.$interval.cancel(this.timeInterval);
  };

  startInterval() {
    this.timeInterval = this.$interval(() => {
      this.currentTime = this.isReady ? this.surfer.getCurrentTime() : 0;
    }, 1000);
  };

  $onChanges(changes) {
    if (changes.urlSrc) {
      this.urlSrc = angular.copy(changes.urlSrc.currentValue);
      this.initWaveSurfer();
    }
    if (changes.imageSrc) {
      this.imageSrc = angular.copy(changes.imageSrc.currentValue);
    }
    if (changes.settings) {
      this.settings = angular.copy(changes.settings.currentValue);
    }
    this.playbackSpeed = this.speed[0];
  }

  $onInit() {
    this.speedIndex = 1;
  }

  responsiveWave() {
    this.surfer.empty();
    this.surfer.drawBuffer();
  }

  $onDestroy() {
    if (this.surfer) {
      this.surfer.destroy();
    }
    this.stopInterval();
  }

  initWaveSurfer() {
    this.cfpLoadingBar.start();
    this.isReady = false;
    this.loading = true;
    this.userSettings = this.settings;

    this.wavesurferProgress = 0;
    this.currentTime = 0;
    this.speed = [
      {
        value: 1,
        label: '1.0x'
      },
      {
        value: 0.75,
        label: '0.75x'
      },
      {
        value: 0.5,
        label: '0.5x'
      }
    ];

    this.themeClass = "md-" + this.$mdTheming.defaultTheme() + "-theme"; //not sure what this affects

    this.defaultSettings = { //not sure we need if db is populated.....
      skipForward: 2,
      skipBack: 2,
      waveColor: '#BDBDBD'
    };

    if (!this.surfer) {
      this.waveElement = angular.element(this.$element[0].querySelector('.waveSurferWave'));
      let defaults = {
        preload: true,
        backend: 'MediaElement',
        progressColor: '#757575',
        cursorColor: '#FF5252',
        height: '200',
        barHeight: 4,
        barWidth: 1,
        scrollParent: false,
        container:this.waveElement[0],
        skipLength: this.userSettings.skipLength,
        waveColor: this.userSettings.waveColor,
      };

      this.options = angular.extend(defaults, (this.playerProperties || {}), this.options);
      this.playerProperties = {};

      this.options = angular.extend({}, defaults, this.options);
      this.surfer = Object.create(WaveSurfer);

      this.surfer.init(this.options);

      this.$window.addEventListener('resize', this.surfer.util.debounce(this.responsiveWave.bind(this), 150));

      this.surfer.on('loading', (progress) => {
        this.wavesurferProgress = progress;
      });

      //occurs after waveform is drawn
      this.surfer.on('waveform-ready', () => {
        // this.loading = false;
        // this.isReady = true;
        // if (this.autoPlay) {
        //   this.surfer.play();
        // }
        //
        this.cfpLoadingBar.complete();
      });


      this.surfer.on('ready', () => {
        this.loading = false;
        this.isReady = true;
        if (this.autoPlay) {
          this.surfer.play();
        }
        // this.loading = false;
        // this.isReady = true;
        // if (this.autoPlay) {
        //   this.surfer.play();
        // }
        // this.cfpLoadingBar.complete();
      });

      this.surfer.on('error', ()=>{
      });

      //on pause event
      //seek to 2 seconds previously
      this.surfer.on('pause', () => {
        let pauseTime = this.surfer.getCurrentTime(); //get current time
        let seekTo = pauseTime - 2 < 0 ? 0 : pauseTime - 2; //seekTo 0 or 2 seconds previously
        this.surfer.seekTo( seekTo / this.surfer.getDuration());
      });

    }

    this.surfer.load(this.urlSrc);

    //play event listener
    this.surfer.on('play', this.play.bind(this));
    //end of sound event listener
    this.surfer.on('finish', this.finish.bind(this));

    if (!!this.imageSrc) {
      let fixPath = this.imageSrc.replace(/\\/g, "/");

     this.waveElement.css({
        'background-image': 'url(' + fixPath + ')',
        'background-size': 'cover',
        'background-position': 'center center'
      });

    } else {
      this.waveElement.css({
        'background-image': 'none',
        'background-size': 'unset',
        'background-position': 'unset'
      });
    }
  }

  pause() {
    if (this.surfer) {
      this.stopInterval();
    }
  }

  finish() {
    if (this.surfer) {
      this.stopInterval();
    }
  }

  play() {
    if (this.surfer) {
      this.startInterval();
    }
  }

  resetWaveSurfer(urlSrc1, urlSrc2) {
    if (urlSrc1 != urlSrc2) {
      this.initWaveSurfer();
    }
  }

  getTimestamp() {
    let timeStamp = this.surfer.getCurrentTime();
    this.$scope.$emit('send:timeStamp', timeStamp);
  }
  setTimestamp(event, seconds) {
    this.surfer.seekTo(seconds / this.surfer.getDuration());
  }
  adjustPlaySpeed() {
    this.playbackSpeed = this.speed[this.speedIndex];
    this.speedIndex = (this.speedIndex + 1) % (this.speed.length);
    this.surfer.setPlaybackRate(this.playbackSpeed.value);
  }
  adjustPlaySpeedUp() {
    this.$timeout(() => {
      this.playbackSpeed = this.speed[this.speedIndex];
      this.speedIndex = (this.speedIndex + 1) % (this.speed.length);
      this.surfer.setPlaybackRate(this.playbackSpeed.value);
    })
  }
  adjustPlaySpeedDown() {
    this.$timeout(() => {
      this.playbackSpeed = this.speed[this.speedIndex];

      this.speedIndex = (this.speedIndex - 1);
      if (this.speedIndex < 0) {
        this.speedIndex = 2;
      }
      this.surfer.setPlaybackRate(this.playbackSpeed.value);
    })
  }
  playPause() {
    this.$timeout(() => {
      this.surfer.playPause();
    })
  }
  scrubForward() {
    this.surfer.skipForward();
  }
  scrubBackward() {
    this.surfer.skipBackward();
  }
}