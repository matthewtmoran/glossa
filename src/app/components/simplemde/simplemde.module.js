import { simplemdeComponent } from './simplemde.component';

export const simplemde = angular
  .module('components.simplemde', [])
  .component('simplemde', simplemdeComponent)
  .name;
