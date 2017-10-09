import uiRouter from '@uirouter/angularjs';
import { metaComponent } from './meta.component';
import { independentMediaComponent } from './independent-media/independent-media.component';
import './meta.scss';
import './independent-media/independent-media.scss';

export const meta = angular
    .module('components.corpus.meta', [
        uiRouter,
    ])
    .component('metaC', metaComponent)
    .component('independentMedia', independentMediaComponent)
    .config(($stateProvider) => {
        'ngInject';

        $stateProvider
            .state('meta', {
                parent: 'corpus',
                url: '/meta',
                component: 'metaC',
            });
    })
    .name;
