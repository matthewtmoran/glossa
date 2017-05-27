import { notebookCardComponent } from './notebook-card.component';
import './notebook-card.scss';

export const notebookCard = angular
  .module('components.notebook.notebookCard', [])
  .component('notebookCard', notebookCardComponent)
  .name;