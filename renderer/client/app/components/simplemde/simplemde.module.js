import { simplemdeComponent } from './simplemde.component';
import './simplemde.scss';

export const simplemde = angular
  .module('components.simplemde', [])
  .component('simplemde', simplemdeComponent)
  .name;
