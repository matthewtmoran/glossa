import { waveSurfer } from './wavesurfer/wavesurfer.module';
import { dialogs } from './dialog/dialog.module';
import { simplemde } from './simplemde/simplemde.module';
import { ParseService } from './parse/parse.service';
import { IpcSerivce } from './ipc/ipc.service';

export const components = angular
  .module('components', [
    waveSurfer,
    dialogs,
    simplemde
  ])
  .service('ParseService', ParseService)
  .service('IpcSerivce', IpcSerivce)
  .name;
