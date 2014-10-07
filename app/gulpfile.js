"use strict";

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require("gulp-notify");

var scripts = ['./*.js'];

gulp.task('watch', function() {
  gulp.watch(scripts, ['lint']);
});

gulp.task('lint', function() {
  return gulp.src(scripts)
    .pipe(jshint())
    .pipe(notify(function (file) {
      if (file.jshint.success) {
        return false;
      }

      var errors = file.jshint.results.map(function (data) {
        if (data.error) {
          return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
        }
      }).join("\n");
      return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
    }));
});

gulp.task('default', ['lint', 'watch'], function() {
});
