import { waveFullComponent } from './wave-full/wave-full.component';
import { wavePreviewComponent } from './wave-preview/wave-preview.component';
import './wavesurfer-player.scss';

export const waveSurfer = angular
  .module('components.wave-surfer', [])
  .component('waveSurferFull', waveFullComponent)
  .component('waveSurferPreview', wavePreviewComponent )
  .name;
