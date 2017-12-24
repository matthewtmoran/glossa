import { windowsTitlebarComponent } from './windows-titlebar.component';
import './windows-titlebar.scss';

export const windowsTitlebar = angular
  .module('components.windowsTitlebar', [])
  .component('windowsTitlebar', windowsTitlebarComponent)
  .name;