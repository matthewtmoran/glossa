import {tagListComponent } from './tag-list.component';
import './tag-list.scss';

export const tagList = angular
  .module('components.notebook.tagList', [])
  .component('tagList', tagListComponent)
  .name;