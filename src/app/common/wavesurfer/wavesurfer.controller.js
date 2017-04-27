import WaveSurfer from 'wavesurferDev';
export class WaveSurferController {
  constructor($timeout, __rootUrl, $mdTheming, RootService, $interval, $scope, cfpLoadingBar ) {
    'ngInject';

    this.$timeout = $timeout;
    this.__rootUrl = __rootUrl;
    this.$mdTheming = $mdTheming;
    this.rootService = RootService;
    this.$interval = $interval;
    this.$scope = $scope;
    this.cfpLoadingBar = cfpLoadingBar;

  // this.initWaveSurfer = this.initWaveSurfer.bind(this);
    this.setTimestamp = this.setTimestamp.bind(this);
    this.getTimestamp = this.getTimestamp.bind(this);

    this.$scope.$on('get:timeStamp', this.getTimestamp);
    this.$scope.$on('set:timeStamp', this.setTimestamp);
  }

  stopInterval () {
    this.$interval.cancel(this.timeInterval);
  };

  startInterval() {
    this.timeInterval = this.$interval(() => {
      this.currentTime = this.isReady ? this.surfer.getCurrentTime() : 0;
    }, 1000);
  };

  $onChanges(changes) {
    if (changes.urlSrc) {
      this.initWaveSurfer();
    }
    this.playbackSpeed = this.speed[0];
  }

  $onInit() {


  }

  resetWaveSurfer() {
    this.initWaveSurfer();
  }

  $onDestroy() {
    if (this.surfer) {
      this.surfer.destroy();
    }
    this.stopInterval();
  }

  initWaveSurfer() {
    this.cfpLoadingBar.start();
    this.timeInterval;
    this.themeClass = "md-" + this.$mdTheming.defaultTheme() + "-theme"; //not sure what this affects
    this.defaultSettings = { //not sure we need if db is populated.....
      skipForward: 2,
      skipBack: 2,
      waveColor: '#BDBDBD'
    };
    this.userSettings = this.rootService.getSettings();
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
    this.loading = true;
    this.wavesurferProgress = 0;
    this.isReady = false;
    this.currentTime = 0;
    if (!this.surfer) {

      this.surfer = Object.create(WaveSurfer);

      let options = {
        container: angular.element('.waveSurferWave')[0]
      };

      let defaults = {
        skipLength: this.userSettings.skipLength,
        scrollParent: false,
        waveColor: this.userSettings.waveColor,
        progressColor: '#757575',
        height: '200',
        barHeight: 3,
        barWidth: 1,
        cursorColor: '#FF5252'
      };


      options = angular.extend(defaults, (this.playerProperties || {}), options);
      this.playerProperties = {};


      this.surfer.init(options);

      this.surfer.on('loading', (progress) => {
        this.wavesurferProgress = progress;
        this.$scope.$apply();
      });

      this.surfer.on('ready', () => {
        this.loading = false;
        this.isReady = true;
        if (this.autoPlay) {
          this.surfer.play();
        }
        this.$scope.$apply();
        this.cfpLoadingBar.complete();
      });
    }

    //play event listener
    this.surfer.on('play', this.play.bind(this));
    //end of sound event listener
    this.surfer.on('finish', this.finish.bind(this));

    // this.title = this.title || this.urlSrc.split('/').pop();

    this.surfer.load(this.urlSrc);

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

  toggleMute() {
    if (this.surfer) {
      this.surfer.toggleMute();
      this.isMute = !this.isMute;
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
}