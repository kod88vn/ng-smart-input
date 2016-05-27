var moduleName = 'typist';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var del = require('del');
var webserver = require('gulp-webserver');

gulp.task('clean', function (cb) {
  del([
      'dist',
      'dist/statics'
  ], cb);
});

gulp.task('jshint', ['clean'], function() {
  gulp.src('/src/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('concat', function() {
  return gulp.src([
  		'node_modules/malarkey/dist/malarkey.js',
	  	'src/app.js'
  	])
  	.pipe(concat('app.js'))
  	.pipe(sourcemaps.init())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));	
});
 
gulp.task('compress', ['concat'], function() {
  return gulp.src('dist/app.js')
    .pipe(uglify({
    	mangle: false
    }))
    .pipe(rename('app.min.js'))
    .pipe(gulp.dest('dist'));	
});

gulp.task('build', [ 
  'clean', 
	'jshint',
	'concat',
	'compress'
	], 
	function() {
	  return gulp.src('index.html')
	    .pipe(cachebust.references())
	    .pipe(gulp.dest('dist'));
});

gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      directoryListing: true,
      open: 'http://localhost:8000/index.html'
    }));
});

gulp.task('serve', ['webserver']);
