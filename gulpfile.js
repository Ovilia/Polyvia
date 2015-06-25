var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var jade        = require('gulp-jade');
var uglify      = require('gulp-uglify');
var concat      = require('gulp-concat');

/**
 * Launch the Server
 */
gulp.task('browser-sync', ['sass'], function() {
    //gulp.run('vendor');
    gulp.run('jade');
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
            'bower_components/jquery/dist/jquery.min.map',
            'bower_components/delaunay-fast/delaunay.js',
            'bower_components/seajs/dist/sea-debug.js',
            'bower_components/dat-gui/build/dat.gui.js'])
        .pipe(gulp.dest('vendor'));
});

/**
 * Build src js files
 */
gulp.task('compress', function() {
    gulp.src(['src/js/GlRenderer.js', 'vendor/*.js'])
        .pipe(uglify())
        .pipe(concat('lib.js'))
        .pipe(gulp.dest('build'));
    gulp.src(['src/js/video.js', 'src/js/image.js'])
        .pipe(uglify())
        .pipe(gulp.dest('build'));
});

/**
 * Compile files from _scss into css
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: function(e) {
                browserSync.notify();
                process.stdout.write(e + '\n');
            },
            outputStyle: 'compressed'
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

/**
 * Generate site using Jade
 */
gulp.task('jade', function() {
    gulp.src('*.jade')
        .pipe(jade())
        .pipe(gulp.dest('.'))
        .pipe(browserSync.reload({stream:true}))
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/*.scss', ['sass']);
    gulp.watch(['*.jade', 'js/*', 'css/*'], ['jade']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
