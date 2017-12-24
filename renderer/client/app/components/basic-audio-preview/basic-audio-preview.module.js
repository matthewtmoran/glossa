import { basicAudioPreviewComponent } from './basic-audio-preview.component';
import './basic-audio-preview.scss';

export const audioPreview = angular
  .module('components.basic-audio-preview', [])
  .component('audioPreview', basicAudioPreviewComponent )
  .name;
