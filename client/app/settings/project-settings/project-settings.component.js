angular.module('glossa')
    .component('projectSettingsComponent', {
        controller: ProjectSettings,
        controllerAs: 'psVm',
        transclude: true,
        templateUrl: 'app/settings/project-settings/project-settings.component.html'
    });

function ProjectSettings() {
    var vm = this;

    $onInit = function() {
        console.log('project settings init');
    };
}