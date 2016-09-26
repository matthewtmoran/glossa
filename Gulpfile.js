var gulp = require('gulp'),
    gutil = require('gulp-util'),
    childProcess = require('child_process'),
    electron = require('electron-prebuilt');

gulp.task('default', function() {
    return gutil.log('Gulp is running!')
});

// create the gulp task
gulp.task('run', function () {
    childProcess.spawn(electron, ['./'], { stdio: 'inherit' });
});


gulp.task('clean:tmp', function() {
    del(['.tmp/**/*'], {dot: true});
});


// .pipe(gulp.dest('.tmp'));
