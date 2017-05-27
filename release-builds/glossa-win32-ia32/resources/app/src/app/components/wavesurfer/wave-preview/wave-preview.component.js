import templateUrl from './wave-preview.html';
import { WaveSurferController }from '../wavesurfer.controller';

export const wavePreviewComponent = {
  bindings: {
    urlSrc: '<',
    imageSrc: '<',
    title: '<',
    extraButtons: '=',
    toolbarClass: '@',
    autoPlay: '<',
    properties: '='
  },
  templateUrl,
  controller: WaveSurferController
};