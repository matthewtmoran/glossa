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

function ProjectSettings(SettingsService, drawerMenu, dialogSrvc) {
    var vm = this;

    vm.$onInit = init;
    vm.updateProject = updateProject;
    vm.exportProject = exportProject;
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

    function exportProject(project) {
        var options = {};
        options.title = "Are you sure you want to export all your project data?";
        options.textContent = "This may take a few minutes...";
        dialogSrvc.confirmDialog(options).then(function(result) {
            if (!result) {
                return;
            }

            console.log('User is sure export data');

            SettingsService.exportProject(project).then(function(data) {
                 console.log('export project returned', data);
            });
        });
    }


}