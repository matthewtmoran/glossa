import { waveSurfer } from './wavesurfer/wavesurfer.module';
import { dialogs } from './dialog/dialog.module';
import { simplemde } from './simplemde/simplemde.module';
import { ParseService } from './parse/parse.service';
import { IpcSerivce } from './ipc/ipc.service';
import { audioPreview } from './basic-audio-preview/basic-audio-preview.module';

export const components = angular
  .module('components', [
    waveSurfer,
    dialogs,
    simplemde,
    audioPreview
  ])
  .service('ParseService', ParseService)
  .service('IpcSerivce', IpcSerivce)
  .name;
