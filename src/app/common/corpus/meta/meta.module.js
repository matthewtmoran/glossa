import uiRouter from 'angular-ui-router';
import { metaComponent } from './meta.component';
import { SimplemdeDirective } from '../../../components/simplemde/simplemde.directive';
import './meta.scss';

export const meta = angular
    .module('components.corpus.meta', [
        uiRouter,
    ])
    .component('metaC', metaComponent)
    .config(($stateProvider) => {
        'ngInject';

        $stateProvider
            .state('meta', {
                parent: 'corpus',
                url: '/meta',
                component: 'metaC',
            });
    })
    .directive('simplemde', ['$parse', '$timeout', ($parse, $timeout) => new SimplemdeDirective($parse, $timeout)])
    .name;
