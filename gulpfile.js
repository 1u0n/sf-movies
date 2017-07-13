var gulp = require('gulp'),
    replace = require('gulp-replace'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    through = require('through2'),
    htmlmin = require('gulp-htmlmin'),
    cleanCSS = require('gulp-clean-css'),
    concatCss = require('gulp-concat-css'),
    removeLogging = require("gulp-remove-logging"),
    rmLines = require('gulp-rm-lines');


gulp.task('default', function(cb) {

    gulp.src('./static/main.js')
        .pipe(removeLogging({
            methods: ["log", "info", "warn", "count", "clear", "trace", "debug", "dir"] //only leave "error"
        }))
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify({ ie8: true }))
        .pipe(through.obj(function(file, enc, cb) {
            gulp.src('./static/main.html')
                .pipe(rmLines({
                    'filters': [
                        /src="main\.js/i,
                        /href="autocomplete\.css/i,
                    ]
                }))
                .pipe(replace(
                    '//.js generated at build time',
                    file.contents.toString('utf8')
                ))
                .pipe(htmlmin({ collapseWhitespace: true }))
                .pipe(gulp.dest('./build/'));
        }))

    gulp.src('./static/autocomplete.js')
        .pipe(removeLogging({
            methods: ["log", "info", "warn", "count", "clear", "trace", "debug", "dir"] //only leave "error"
        }))
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify({ ie8: true }))
        .pipe(gulp.dest('./build/'));

    gulp.src(['./static/main.css', './static/autocomplete.css'])
        .pipe(concatCss("main.css"))
        .pipe(cleanCSS({
            compatibility: 'ie8',
            level: {
                2: {
                    mergeNonAdjacentRules: true,
                    mergeSemantically: true
                }
            }
        }))
        .pipe(gulp.dest('./build/'));

    gulp.src(['./static/images/*'])
        .pipe(gulp.dest('./build/images/'));

});