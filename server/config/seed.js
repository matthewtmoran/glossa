/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Notebook = require('../api/notebook/notebook.model');
var Project = require('../api/project/project.model');


Project.find({"defaultProject": true}, function(err, project) {
    console.log('Project find  running');
    if (err) {
        console.log("There was en error ", err);
    }

    if (project.length < 1){
        Project.insert({
            "name": "Project",
            "description": "This is the project description",
            "defaultProject": true
        })
    }
});

// Project.remove({"_id": 123456789}, {multi: true}, function (err, numRemoved) {
//     if (err) {
//         return console.log('There was an error in Project seed removal')
//     }
//
//     if (numRemoved < 1) {
//
//     }
//
//     Project.insert({
//         "_id": 123456789,
//         "name": "Project",
//         "Description": "This is a description"
//     })
//
// });

// Notebook.find({}).remove(function() {
//   Notebook.create({
//     name : 'Development Tools',
//     info : 'Integration with popular tools such as Bower, Grunt, Karma, Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, Stylus, Sass, CoffeeScript, and Less.'
//   }, {
//     name : 'Server and Client integration',
//     info : 'Built with a powerful and fun stack: MongoDB, Express, AngularJS, and Node.'
//   }, {
//     name : 'Smart Build System',
//     info : 'Build system ignores `spec` files, allowing you to keep tests alongside code. Automatic injection of scripts and styles into your index.html'
//   },  {
//     name : 'Modular Structure',
//     info : 'Best practice client and server structures allow for more code reusability and maximum scalability'
//   },  {
//     name : 'Optimized Build',
//     info : 'Build process packs up your templates as a single JavaScript payload, minifies your scripts/css/images, and rewrites asset names for caching.'
//   },{
//     name : 'Deployment Ready',
//     info : 'Easily deploy your app to Heroku or Openshift with the heroku and openshift subgenerators'
//   });
// });