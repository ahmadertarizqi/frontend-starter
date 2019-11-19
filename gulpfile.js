'use strict'
// general
const { src, dest, watch, series, parallel } = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const mergeStream = require('merge-stream');
const del = require('del');

// styling
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const minifycss = require('gulp-clean-css') // cssnano

// scripts
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');


// path location
const paths = {
    output: "dist/",
    
    html : {
        input: 'src/*.html',
        output: 'dist/'
    },

    styles: {
        input: "src/scss/**/*.scss",
        inputCss: "src/css/",
        outputCss: "src/css/*.css",
        output: "dist/css",
    },
    
    scriptJs: {
        input: "src/js/**/*.js",
        output: "dist/js"
    }
}

async function cleanDist() {
   return del.sync([paths.output]);
}

function reloadBrowser() {
    browserSync.reload();
}

function scssTask() {
    return src(paths.styles.input)
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass()).on('error', sass.logError)
        .pipe(postcss([autoprefixer()]))
        .pipe(sourcemaps.write("."))
        .pipe(dest(paths.styles.inputCss))

        // browsersync after compilation
        .pipe(browserSync.stream({
            stream: true
        }));
}

// Optimization Files
function buildStyle() {
    return src(paths.styles.outputCss)
        .pipe(postcss([autoprefixer()]))
        .pipe(minifycss())
        .pipe(dest(paths.styles.output));
}

function buildScript() {
    const lib = src("src/js/lib/*.js", { sourcemaps: true })
        .pipe(concat("lib.min.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("."))
        .pipe(dest(paths.scriptJs.output));
    const single = src("src/js/*.js").pipe(dest(paths.scriptJs.output));

    return mergeStream(lib, single);
}

function htmlTask() {
    return src(paths.html.input)
        .pipe(dest(paths.html.output));
}

function liveWatch() {
    browserSync.init({
        server: {
            baseDir: "./src"
        }
    });

    watch(paths.styles.input, scssTask);
    watch(paths.scriptJs.input, reloadBrowser);
    watch("src/*.html", reloadBrowser);
    // watch(paths.input, series(exports.default, reloadBrowser));
}

exports.default = series(cleanDist, parallel(buildStyle, buildScript, htmlTask));
exports.build = exports.default;
exports.dev = liveWatch;
