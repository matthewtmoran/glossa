var gulp = require('gulp'),
    gutil = require('gulp-util'),
    inject = require('gulp-inject'),
    sass = require('gulp-sass'),
    childProcess = require('child_process'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    electron = require('electron-prebuilt'),
    _ = require('lodash'),
    runSequence = require('run-sequence'),
    webpack = require('webpack-stream'),
    plugins = gulpLoadPlugins();

var clientPath = 'client';
var serverPath = 'server';

var paths = {
    client: {
        assests: clientPath + '/assests/**/*',
        images: clientPath + '/assests/images/**/*',
        // styles: [clientPath + '/app/**/*.scss'],
        styles: [clientPath + '/{app,components}/**/*.scss'],
        mainStyle: clientPath + '/app/app.scss',
        views: clientPath + '/{app,components}/**/*.html',
        mainView: clientPath + '/index.html',
        scripts: [clientPath + '/**/!(*.spec|*.mock)/*.js']
    }
};

//test gulp task
gulp.task('default', function() {
    return gutil.log('Gulp is running!')
});

// This runs electron
gulp.task('run', function () {
    childProcess.spawn(electron, ['./'], { stdio: 'inherit' });
});


//call the inject
gulp.task('inject', function (cb) {
    runSequence(['inject:sass'], cb);
});

//injects all scss files that I want and creates css
gulp.task('inject:sass', function() {
    return gulp.src(paths.client.mainStyle)
        .pipe(plugins.inject(
            gulp.src(_.union(paths.client.styles, ['!' + paths.client.mainStyle]), {read: false})
                .pipe(plugins.sort()),
            {
                transform: function(filepath) {
                    var newPath = filepath
                        .replace('/' + clientPath + '/app/', '')
                        .replace('/' + clientPath + '/components/', '../components/')
                        .replace(/_(.*).scss/, function(match, p1, offset, string) {
                            return p1
                        })
                        .replace('.scss', '');
                    return '@import \'' + newPath + '\';';
                }

            }))
        // .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(clientPath + '/app'));
});

gulp.task('inject:js', function() {
    return gulp.src()
})


gulp.task('styles', function() {
    return gulp.src(paths.client.mainStyle)
        .pipe(sass())
        .pipe(gulp.dest(clientPath + '/app'));
});



gulp.task('index', function() {
    var sources = gulp.src([clientPath + '/app/*.css'], {read: false});

    return gulp.src(paths.client.mainView)
        .pipe(inject(sources,
            {
                ignorePath: clientPath,
                addRootSlash: false
            }
        ))
        .pipe(gulp.dest(clientPath));
});



gulp.task('watch', function() {
    gulp.watch(paths.client.styles, ['styles']);
});

gulp.task('build:data', function() {

});

gulp.task('populate:hashtags', function() {

});



gulp.task('serve', function (cb) {
    runSequence(
        [
            // 'clean:tmp',
            // 'lint:scripts',
            'inject',
            'styles',
            'index',
            'run',
            'watch'
            // 'copy:fonts:dev',
            // 'env:all'
        ],
        // ['start:server', 'start:client'],
        // 'watch',
        cb
    );
});

