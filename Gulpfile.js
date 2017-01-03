var gulp = require('gulp'),
    gutil = require('gulp-util'),
    childProcess = require('child_process'),
    mainBowerFiles = require('main-bower-files'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    // electron = require('electron-prebuilt'),
    _ = require('lodash'),
    runSequence = require('run-sequence'),
    plugins = gulpLoadPlugins();
    electron = require('electron-connect').server.create();

var clientPath = 'client';
var serverPath = 'server';

var paths = {
    client: {
        root: clientPath,
        assets: clientPath + '/assets/**/*',
        images: clientPath + '/assets/images/**/*',
        // styles: [clientPath + '/app/**/*.scss'],
        styles: [clientPath + '/{app,components,assets}/**/*.scss'],
        mainStyle: clientPath + '/app/app.scss',
        views: clientPath + '/{app,components}/**/*.html',
        mainView: clientPath + '/index.html',
        scripts: [clientPath + '/**/!(*.spec|*.mock)/*.js'],
        jsScripts: [
            "./client/app/**/*.js",
            "./client/assets/**/*.js",
            "./client/components/**/*.js",
            "./client/db/**/*.js",
            "!./client/**/*.utils.js",
            "!./client/**/database.js",
            "!./client/assets/**/*.min.js",
        ]
    }
};

//test gulp task
gulp.task('default', function() {
    return gutil.log('Gulp is running!')
});

// This runs electron
gulp.task('run', function () {

    // Set default node environment to development
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';

    electron.start();

    // childProcess.spawn(electron, ['./'], { stdio: 'inherit' });
});


//call the inject
gulp.task('inject', function (cb) {
    runSequence('inject:sass', cb);
});

/**
 * Injects scss
 * gets all scss files as defined by path
 * sorts them into a single array (_union)
 * sorts the files accordingly
 * transforms the path into the correct relative path
 * checks for errors
 * injects into app.scss
 */
gulp.task('inject:sass', function() {
    return gulp.src(paths.client.mainStyle)
        .pipe(plugins.inject(
            gulp.src(_.union(paths.client.styles, ['!' + paths.client.mainStyle]), {read: false})
                .pipe(plugins.sort()), //sorts files...
            {
                transform: function(filepath) { //transform path to a realtive path
                    var newPath = filepath
                        .replace('/' + clientPath + '/app/', '')
                        .replace('/' + clientPath + '/components/', '../components/')
                        .replace('/' + clientPath + '/assets/', '../assets/')
                        .replace(/_(.*).scss/, function(match, p1, offset, string) {
                            return p1
                        })
                        .replace('.scss', '');
                    return '@import \'' + newPath + '\';';
                }
            }
            ))
        // .pipe(plugins.sass().on('error', plugins.sass.logError))
        .pipe(gulp.dest(clientPath + '/app'));
});

gulp.task('inject:js', function() {
    console.log('gulpTask: inject:js');

   // return gulp.src(paths.client.mainView)
   //      .pipe(plugins.inject(
   //          gulp.src(paths.client.jsScripts).pipe(plugins.angularFilesort()), {ignorePath: 'client', addRootSlash: false}
   //      ))
   //      .pipe(gulp.dest(paths.client.root));

    // return gulp.src(paths.client.mainView)
    //     .pipe(plugins.inject(
    //         gulp.src(paths.client.jsScripts, { read: false }), {ignorePath: 'client', addRootSlash: false}
    //     ))
    //     .pipe(gulp.dest(paths.client.root));
});

gulp.task('inject:bower', function() {
    console.log('gulpTask: inject:bower');
    // return gulp.src(paths.client.mainView)
    //     .pipe(plugins.inject(
    //         gulp.src(mainBowerFiles(), { base: 'client/bower_components' }, {read: false}), {ignorePath: 'client', addRootSlash: false, starttag: '<!-- bower:{{ext}} -->'}
    //     ))
    //     .pipe(gulp.dest(paths.client.root));
});

/**
 * Take main style sheet
 */
gulp.task('styles', function() {
    console.log('gulp.task:styles');
    return gulp.src(paths.client.mainStyle)
        .pipe(plugins.sass())
        .pipe(plugins.sass().on('error', plugins.sass.logError))
        .pipe(gulp.dest(clientPath + '/app'));
});

gulp.task('index', function() {
    var cssSources = gulp.src([clientPath + '/app/*.css'], {read: false});
    // var appSources = gulp.src(paths.client.jsScripts).pipe(plugins.angularFilesort());
    // var bowerSources = gulp.src(mainBowerFiles(), { base: 'client/bower_components' }, {read: false});

    return gulp.src(paths.client.mainView)
        .pipe(plugins.inject(cssSources, { ignorePath: clientPath, addRootSlash: false}))
        // .pipe(plugins.inject(appSources, { ignorePath: clientPath, addRootSlash: false}))
        // .pipe(plugins.inject(bowerSources, { ignorePath: clientPath, addRootSlash: false, starttag: '<!-- bower:{{ext}} -->'}))
        .pipe(gulp.dest(clientPath));
});

gulp.task('watch', function() {
    gulp.watch(paths.client.styles, ['styles', electron.reload] );
    // gulp.watch(paths.client.jsScripts, electron.reload);
});

gulp.task('serve', function (cb) {
    runSequence(
        [
            'styles',
            'inject',
            'index'
        ],[
            'run',
            'watch'
        ],
        cb
    );
});



