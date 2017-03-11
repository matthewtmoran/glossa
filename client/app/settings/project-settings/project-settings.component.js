angular.module('glossa')
    .component('projectSettingsComponent', {
        controller: ProjectSettings,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/project-settings/project-settings.component.html',
        bindings: {
            project: '='
        }
    });

function ProjectSettings(SettingsService, drawerMenu) {
    var vm = this;

    vm.$onInit = init;
    vm.updateProject = updateProject;
    vm.isSaving = false;

    function init() {
        console.log('project settings init');
    }

    function updateProject(project) {
        vm.isSaving = true;
        SettingsService.updateProject(project).then(function(data) {
            vm.project = data;
            drawerMenu.updateProjectName(vm.project.name);
            vm.isSaving = false;
        })
    }


}