(function (require) {

    'use strict';

    var gulp = require('gulp'),
        minify = require('gulp-uglify'),
        cleanCss = require('gulp-clean-css'),
        jshint = require('gulp-jshint'),
        concat = require('gulp-concat'),
        sourceMaps = require('gulp-sourcemaps'),
        config = require('./gulpConfig.json'),
        concatConfig = {newLine: '\n;'};

    function compileJs() {
        return gulp.src(config.src.js)
            .pipe(jshint())
            .pipe(sourceMaps.init())
            // .pipe(minify())
            .pipe(concat(config.build.js), concatConfig)
            .pipe(sourceMaps.write())
            .pipe(gulp.dest(config.build.dir));
    }

    function compileCss() {
        return gulp.src(config.src.css)
            .pipe(concat(config.build.css))
            .pipe(cleanCss())
            .pipe(gulp.dest(config.build.dir));
    }

    gulp.task('js', compileJs);
    gulp.task('css', compileCss);
    gulp.task('default', ['js', 'css']);
})(require);
