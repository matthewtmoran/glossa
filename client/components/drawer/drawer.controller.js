angular.module('glossa')
    .controller('drawerCrtl', drawerCrtl);

function drawerCrtl(drawerMenu, $mdDialog, dialogSrvc) {
    var dVm = this;

    dVm.isOpen = isOpen;
    dVm.toggleOpen = toggleOpen;
    dVm.isSettingsOpen = isSettingsOpen;
    dVm.toggleSettingsOpen = toggleSettingsOpen;
    dVm.showSettings = showSettings;

    dVm.autoFocusContent = false;
    dVm.menu = drawerMenu;

    dVm.status = {
        isFirstOpen: true,
        isFirstDisabled: false
    };

    function isOpen(section) {
        return dVm.menu.isSectionSelected(section);
    }
    function toggleOpen(section) {
        dVm.menu.toggleSelectSection(section);
    }
    function isSettingsOpen(section) {
        return dVm.menu.isSectionSettingsSelected(section);
    }
    function toggleSettingsOpen(section) {
        dVm.menu.toggleSettingsSection(section);
    }
    function showSettings() {
        dialogSrvc.settingsFull();
    }


}