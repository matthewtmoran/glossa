angular.module('glossa')
    .controller('drawerCrtl', drawerCrtl);

function drawerCrtl(drawerMenu) {
    var dVm = this;

    dVm.isOpen = isOpen;

    dVm.toggleOpen = toggleOpen;
    dVm.autoFocusContent = false;
    dVm.menu = drawerMenu;

    dVm.status = {
        isFirstOpen: true,
        isFirstDisabled: false
    };

    // dvm.section = [
    //     {
    //         name: 'Beers',
    //         type: 'toggle',
    //         pages: [{
    //             name: 'IPAs',
    //             type: 'link',
    //             state: 'beers.ipas',
    //             icon: 'fa fa-group'
    //         }, {
    //             name: 'Porters',
    //             state: 'home.toollist',
    //             type: 'link',
    //             icon: 'fa fa-map-marker'
    //         },
    //             {
    //                 name: 'Wheat',
    //                 state: 'home.createTool',
    //                 type: 'link',
    //                 icon: 'fa fa-plus'
    //             }
    //         ]
    // }];

    function isOpen(section) {
        return dVm.menu.isSectionSelected(section);
    }
    function toggleOpen(section) {
        dVm.menu.toggleSelectSection(section);
    }


}