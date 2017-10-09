import {userListComponent } from './user-list.component';
import './user-list.scss';

export const userList = angular
  .module('components.notebook.userList', [])
  .component('userList', userListComponent)
  .name;