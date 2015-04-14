var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var scsslint    = require('gulp-scsslint');

/**
 * Launch the Server
 */
gulp.task('browser-sync', ['sass'], function() {
    gulp.run('vendor');
    browserSync({
        server: {
            baseDir: '.'
        }
    });
});

/**
 * Copy the bower packages
 */
gulp.task('vendor', function() {
    gulp.src(['bower_components/jquery/dist/jquery.min.js',
            'bower_components/jquery/dist/jquery.min.map'])
        .pipe(gulp.dest('vendor'));
});

/**
 * Compile files from _scss into css
 */
gulp.task('sass', function () {
    gulp.run('lint');
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify,
            outputStyle: 'compressed'
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

/**
 * Generate sass lint report
 */
gulp.task('lint', function() {
    gulp.src('_scss/*.scss')
        .pipe(scsslint())
        .pipe(scsslint.reporter());
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/*.scss', ['sass']);
    gulp.watch(['*.html', 'js/*', 'css/*']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
