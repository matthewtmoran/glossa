'use strict';
//TODO: move to notebooks service
angular.module('glossa')
    .factory('postSrvc', postSrvc);

function postSrvc() {
    var simplemdeTollbar = [
        {
            name: "italic",
            action: SimpleMDE.toggleItalic,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: 'format_italic',
            title: "Italic",
        },
        {
            name: "bold",
            action: SimpleMDE.toggleBold,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "format_bold",
            title: "Bold",
        },
        {
            name: "header",
            action: SimpleMDE.toggleHeading1,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "title",
            title: "Header",
        },
        "|", // Separator
        {
            name: "Blockquote",
            action: SimpleMDE.toggleBlockquote,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "format_quote",
            title: "Blockquote",
        },
        {
            name: "Bullet List",
            action: SimpleMDE.toggleUnorderedList,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "format_list_bulleted",
            title: "Bullet List",
        },
        {
            name: "Ordered List",
            action: SimpleMDE.toggleOrderedList,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: 'format_list_numbered',
            title: "Numbered List",
        },
        "|",
        {
            name: "Toggle Preview",
            action: SimpleMDE.togglePreview,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: 'visibility',
            title: "Toggle Preview",
        },
        {
            name: "Help",
            action: test,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass:'help',
            title: "Toggle Preview",
        }
    ];

    var service = {
        postOptions: postOptions,
    };
    return service;

    /**
     * Sets the simplemde options based on post types
     * @param ev - target event
     * @param notebook = the notebooks that was selected
     * @returns options for post type template and simplemde {{simplemde: {}, template: string}}
     * TODO: should refractor these template to just use the same one?
     */
    function postOptions(ev, notebook) {
        var options = {
            simplemde: {},
            template: '',
        };

        switch(notebook.postType) {
            case 'image':
                options.template = 'app/notebooks/notebook-dialog/notebook-dialog-image.controller.html';
                options.simplemde = {
                    toolbar: false,
                    status: false,
                    spellChecker: false,
                    autoDownloadFontAwesome: false,
                    // forceSync: true,
                    placeholder: 'Image caption...',
                };
                break;
            case 'audio':
                options.template = 'app/notebooks/notebook-dialog/notebook-dialog-audio.controller.html';
                options.simplemde = {
                    toolbar: false,
                    status: false,
                    spellChecker: false,
                    autoDownloadFontAwesome: false,
                    // forceSync: true,
                    placeholder: 'Audio caption...'
                };
                break;
            case 'normal':
                options.template = 'app/notebooks/notebook-dialog/notebook-dialog.controller.html';
                options.simplemde = {
                    toolbar: simplemdeTollbar,
                    spellChecker: false,
                    status: false,
                    autoDownloadFontAwesome: false,
                    // forceSync: true,
                    placeholder: 'Post description...',
                };
                break;
            case 'default':
                console.log('error');
        }
        return options;
    }

    function test(e) {
        console.log('test', e);
    }

}