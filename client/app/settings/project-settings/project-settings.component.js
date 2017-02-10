angular.module('glossa')
    .component('projectSettingsComponent', {
        controller: ProjectSettings,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/project-settings/project-settings.component.html'
    });

function ProjectSettings(SettingsService, drawerMenu) {
    var vm = this;

    vm.$onInit = init;
    vm.updateProject = updateProject;

    function init() {
        console.log('project settings init');
        SettingsService.getProject().then(function(data) {
           vm.project = data;
        });
    }

    function updateProject(project) {
        SettingsService.updateProject(project).then(function(data) {
            vm.project = data;
            drawerMenu.updateProjectName(vm.project.name)
        })
    }


}