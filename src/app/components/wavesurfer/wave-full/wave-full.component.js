import templateUrl from './wave-full.html';
import { WaveSurferController }from '../wavesurfer.controller';

export const waveFullComponent = {
  bindings: {
    urlSrc: '<',
    imageSrc: '<',
    title: '<',
    extraButtons: '=',
    toolbarClass: '@',
    autoPlay: '<',
    settings: '<',
    properties: '='
  },
  templateUrl,
  controller: WaveSurferController
};
