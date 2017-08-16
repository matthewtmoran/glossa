import { userCardComponent } from './user-card.component';
import './user-card.scss';

export const userCard = angular
  .module('components.settings.sharing.userCard', [])
  .component('userCard', userCardComponent)
  .name;
