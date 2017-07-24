var gulp = require('gulp'),
    replace = require('gulp-replace'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    through = require('through2'),
    htmlmin = require('gulp-htmlmin'),
    cleanCSS = require('gulp-clean-css'),
    concatCss = require('gulp-concat-css'),
    removeLogging = require("gulp-remove-logging");


gulp.task('default', function(cb) {

    //mini & uglify the webpack-ed bundle and insert it into the html file as a <script>
    gulp.src(['./dist/bundle.js'])
        .pipe(removeLogging({
            methods: ["log", "info", "warn", "count", "clear", "trace", "debug", "dir"] //only leave "error"
        }))
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify({ ie8: true }))
        .pipe(through.obj(function(file, enc, cb) {
            gulp.src('./src/html/main.html')
                .pipe(replace(
                    '//bundle.js generated at build time',
                    file.contents.toString('utf8')
                ))
                .pipe(htmlmin({ collapseWhitespace: true }))
                .pipe(gulp.dest('./dist/'));
        }))

    gulp.src(['./src/css/main.css', './src/css/autocomplete.css'])
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
        .pipe(gulp.dest('./dist/'));

    gulp.src(['./resources/images/*'])
        .pipe(gulp.dest('./dist/images/'));

});