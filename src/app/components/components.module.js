import { corpus } from './corpus/courpus.module';
import { notebook } from './notebook/notebook.module';
import { settings } from './settings/settings.module';

export const components = angular
  .module('components', [
    corpus,
    notebook,
    settings
    // contact,
  ])
  .name;
