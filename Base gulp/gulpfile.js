// Include gulp
var gulp = require('gulp');

var fileexists = require('file-exists');
var fs         = require('fs');
var yaml       = require('js-yaml');

var runseq = require('run-sequence');

// Include Plugins
var sass         = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    jshint       = require('gulp-jshint'),
    concat       = require('gulp-concat'),
    uglify       = require('gulp-uglify'),
    spritesmith  = require('gulp.spritesmith'),
    imagemin     = require('gulp-imagemin'),
    buffer       = require('vinyl-buffer'),
    mergestream  = require('merge-stream'),
    iconfont     = require('gulp-iconfont'),
    consolidate  = require('gulp-consolidate'),
    merge        = require('deepmerge'),
    rename       = require('gulp-rename'),
    match        = require('match-like-gulp'),
    gulpif       = require('gulp-if'),
    plumber      = require('gulp-plumber'),
    sourcemaps   = require('gulp-sourcemaps'),
    notify       = require('gulp-notify');

var bsync = require('browser-sync').create();

// Settings
var config = {};
if (fileexists('./gulpconfig.yml')) {
    config = yaml.safeLoad(fs.readFileSync('./gulpconfig.yml', 'utf8'));
} else if (fileexists('./gulpconfig.json')) {
    config = require('./gulpconfig.json');
} else {
    console.error('No config file found.');
    process.exit();
}

// Tasks lists
var tasks_sass_build    = [],
    tasks_sass_watch    = [],
    tasks_js_build      = [],
    tasks_js_watch      = [],
    tasks_images_build  = [],
    tasks_images_watch  = [],
    tasks_sprites_build = [],
    tasks_sprites_watch = [],
    tasks_fonts_build   = [],
    tasks_fonts_watch   = [],
    tasks_build         = [],
    tasks_watch         = [];

var task_name;

var run_timestamp = Math.round(Date.now() / 1000);


//////////////////////////////////////
// Sass Tasks
//////////////////////////////////////
if (typeof config.sass !== 'undefined') {
    for (task_name in config.sass.tasks) {
        if (config.sass.tasks.hasOwnProperty(task_name)) {
            (function (task_name) {
                var current_task = config.sass.tasks[task_name];

                var task_name_build = 'build-sass-' + task_name;
                var task_name_watch = 'watch-sass-' + task_name;

                tasks_sass_build.push(task_name_build);
                tasks_sass_watch.push(task_name_watch);

                // Compile sass
                gulp.task(task_name_build, function () {
                    return gulp.src(current_task.src)
                               .pipe(gulpif(current_task.sourcemap, sourcemaps.init()))
                               .pipe(plumber({errorHandler: Utils.onError}))
                               .pipe(sass(config.sass.settings).on('error', sass.logError))
                               .pipe(plumber.stop())
                               .pipe(autoprefixer(config.autoprefixer))
                               .pipe(sourcemaps.write('.'))
                               .pipe(gulp.dest(current_task.dst))
                               .pipe(bsync.reload({match: '**/*.css', stream: true}));
                });

                // Watch sass
                gulp.task(task_name_watch, function () {
                    return gulp.watch(current_task.src, [task_name_build]);
                });
            }(task_name));
        }
    }

    // Global build sass
    gulp.task('build-sass', tasks_sass_build);
    tasks_build.push('build-sass');

    // Global sass watch
    gulp.task('watch-sass', tasks_sass_watch);
    tasks_watch.push('watch-sass');
}


//////////////////////////////////////
// Javascript Tasks
//////////////////////////////////////
if (typeof config.javascript !== 'undefined') {
    for (task_name in config.javascript.tasks) {
        if (config.javascript.tasks.hasOwnProperty(task_name)) {

            (function (task_name) {
                var current_task = config.javascript.tasks[task_name];

                var task_name_build = 'build-js-' + task_name;
                var task_name_watch = 'watch-js-' + task_name;

                tasks_js_build.push(task_name_build);
                tasks_js_watch.push(task_name_watch);

                // Compile javascripts
                gulp.task(task_name_build, function (cb) {
                    gulp.src(current_task.src)
                        .pipe(gulpif(current_task.sourcemap, sourcemaps.init()))
                        .pipe(plumber({errorHandler: Utils.onError}))
                        .pipe(gulpif(Utils.lint_ignore, jshint()))
                        .pipe(jshint.reporter('jshint-stylish'))
                        .pipe(jshint.reporter('fail'))
                        .pipe(plumber.stop())
                        .pipe(concat(current_task.filename))
                        .pipe(uglify())
                        .pipe(rename({
                            suffix: '.min'
                        }))
                        .pipe(sourcemaps.write('.'))
                        .pipe(gulp.dest(current_task.dst));

                    return gulp.src(current_task.src)
                               .pipe(gulpif(current_task.sourcemap, sourcemaps.init()))
                               .pipe(plumber({errorHandler: Utils.onError}))
                               .pipe(gulpif(Utils.lint_ignore, jshint()))
                               .pipe(jshint.reporter('jshint-stylish'))
                               .pipe(jshint.reporter('fail'))
                               .pipe(plumber.stop())
                               .pipe(concat(current_task.filename))
                               .pipe(sourcemaps.write('.'))
                               .pipe(gulp.dest(current_task.dst))
                               .pipe(bsync.reload({match: '**/*.js', stream: true}));

                });

                // Watch javascripts
                gulp.task(task_name_watch, function () {
                    return gulp.watch(current_task.src, [task_name_build]);
                });
            }(task_name));
        }
    }

    // Global build javascripts
    gulp.task('build-js', tasks_js_build);
    tasks_build.push('build-js');

    // Global watch javascripts
    gulp.task('watch-js', tasks_js_watch);
    tasks_watch.push('watch-js');
}


//////////////////////////////////////
// Images Tasks
//////////////////////////////////////
if (typeof config.images !== 'undefined') {
    for (task_name in config.images.tasks) {
        if (config.images.tasks.hasOwnProperty(task_name)) {
            (function (task_name) {
                var current_task = config.images.tasks[task_name];

                var task_name_build = 'build-images-' + task_name;
                var task_name_watch = 'watch-images-' + task_name;

                tasks_images_build.push(task_name_build);
                tasks_images_watch.push(task_name_watch);

                // Compile images
                gulp.task(task_name_build, function () {
                    return gulp.src(current_task.src)
                               .pipe(plumber({errorHandler: Utils.onError}))
                               .pipe(imagemin(merge({
                                   progressive: true,
                                   svgoPlugins: [{removeViewBox: false}]
                               }, current_task.settings)))
                               .pipe(gulp.dest(current_task.dst));
                });

                // Watch images
                gulp.task(task_name_watch, function () {
                    return gulp.watch(current_task.src, [task_name_build]);
                });
            }(task_name));
        }
    }

    // Global build sass
    gulp.task('build-images', tasks_images_build);
    tasks_build.push('build-images');

    // Global sass watch
    gulp.task('watch-images', tasks_images_watch);
    tasks_watch.push('watch-images');
}


//////////////////////////////////////
// Sprites Tasks
//////////////////////////////////////
if (typeof config.sprites !== 'undefined') {
    for (task_name in config.sprites.tasks) {
        if (config.sprites.tasks.hasOwnProperty(task_name)) {

            (function (task_name) {
                var current_task = config.sprites.tasks[task_name];

                var task_name_build = 'build-sprites-' + task_name;
                var task_name_watch = 'watch-sprites-' + task_name;

                tasks_sprites_build.push(task_name_build);
                tasks_sprites_watch.push(task_name_watch);

                // Compile sprites
                gulp.task(task_name_build, function () {
                    var hash                 = Utils.generate_hash(),
                        img_name             = 'sprites-' + task_name + '.png',
                        retina_img_name      = 'sprites-' + task_name + '@2x.png',
                        img_name_abs         = (current_task.dst + '/' + img_name).replace('//', '/'),
                        retina_img_name_abs  = (current_task.dst + '/' + retina_img_name).replace('//', '/'),
                        spritesmith_settings = {
                            imgName           : img_name_abs,
                            imgPath           : (current_task.sass.rel + '/' + img_name).replace('//', '/') + '?v=' + hash,
                            cssName           : '_sprites-' + task_name + '.scss',
                            cssVarMap         : function (sprite) {
                                if (typeof(current_task['2x']) !== 'undefined' && match(sprite.source_image, current_task['2x'].map(Utils.map_match_patterns))) {
                                    sprite.name = task_name + '-' + sprite.name + '-retina';
                                } else {
                                    sprite.name = task_name + '-' + sprite.name;
                                }
                            },
                            cssSpritesheetName: 'spritesheet-' + task_name,
                            padding           : 4
                        };

                    var src_files = current_task.src;

                    if (typeof current_task['1x'] !== 'undefined' && typeof current_task['2x'] !== 'undefined') {
                        src_files = merge(current_task['1x'], current_task['2x']);

                        spritesmith_settings = merge(spritesmith_settings, {
                            retinaSrcFilter         : current_task['2x'],
                            retinaImgName           : retina_img_name_abs,
                            retinaImgPath           : (current_task.sass.rel + '/' + retina_img_name).replace('//', '/') + '?v=' + hash,
                            cssRetinaSpritesheetName: 'retina-spritesheet-' + task_name,
                            cssRetinaGroupsName     : 'retina-groups-' + task_name
                        });
                    }

                    var sprite = gulp.src(src_files)
                                     .pipe(plumber({errorHandler: Utils.onError}))
                                     .pipe(spritesmith(spritesmith_settings));

                    sprite.img.pipe(gulp.dest('.'));
                    sprite.css.pipe(gulp.dest(current_task.sass.dst));

                    return sprite.pipe(bsync.reload({stream: true}));
                });

                // Watch sprites
                gulp.task(task_name_watch, function () {
                    var src_files = current_task.src;

                    if (typeof current_task['1x'] !== 'undefined' && typeof current_task['2x'] !== 'undefined') {
                        src_files = merge(current_task['1x'], current_task['2x']);
                    }

                    return gulp.watch(src_files, [task_name_build]);
                });
            }(task_name));
        }
    }

    // Global build sprites
    gulp.task('build-sprites', tasks_sprites_build);
    tasks_build.push('build-sprites');

    // Global watch sprites
    gulp.task('watch-sprites', tasks_sprites_watch);
    tasks_watch.push('watch-sprites');
}


//////////////////////////////////////
// Fontcustom Tasks
//////////////////////////////////////
if (typeof config.fonts !== 'undefined') {
    for (task_name in config.fonts.tasks) {
        if (config.fonts.tasks.hasOwnProperty(task_name)) {
            (function (task_name) {
                var current_task = config.fonts.tasks[task_name];

                var task_name_build = 'build-font-' + task_name;
                var task_name_watch = 'watch-font-' + task_name;

                tasks_fonts_build.push(task_name_build);
                tasks_fonts_watch.push(task_name_watch);

                // Compile sass
                gulp.task(task_name_build, function () {
                    var font_name  = 'font-' + task_name,
                        class_name = 'icon-' + task_name;

                    return gulp.src(current_task.src)
                               .pipe(plumber({errorHandler: Utils.onError}))
                               .pipe(iconfont({
                                   fontName          : font_name,
                                   centerHorizontally: true,
                                   normalize         : true,
                                   formats           : ['ttf', 'eot', 'woff', 'woff2', 'svg'],
                                   timestamp         : run_timestamp
                               }))
                               .on('glyphs', function (glyphs) {
                                   return gulp.src('integration/templates/fontawesome-style-hashed.css')
                                              .pipe(consolidate('lodash', {
                                                  glyphs   : glyphs.map(Utils.map_glyphs),
                                                  fontName : font_name,
                                                  fontPath : (current_task.sass.rel + '/').replace('//', '/'),
                                                  className: class_name,
                                                  hash     : Utils.generate_hash()
                                              }))
                                              .pipe(rename({basename: '_' + font_name, extname: '.scss'}))
                                              .pipe(gulp.dest(current_task.sass.dst));
                               })
                               .pipe(plumber.stop())
                               .pipe(gulp.dest(current_task.dst))
                               .pipe(bsync.reload({stream: true}));
                });

                // Watch sass
                gulp.task(task_name_watch, function () {
                    return gulp.watch(current_task.src, [task_name_build]);
                });
            }(task_name));
        }
    }

    // Global build sass
    gulp.task('build-fonts', tasks_fonts_build);
    tasks_build.push('build-fonts');

    // Global sass watch
    gulp.task('watch-fonts', tasks_fonts_watch);
    tasks_watch.push('watch-fonts');
}


//////////////////////////////////////
// BrowserSync
//////////////////////////////////////
if (typeof config.browsersync !== 'undefined') {
    gulp.task('bsync', function () {
        return bsync.init(merge({
            open: 'external',
            ui  : false
        }, config.browsersync.settings));
    });

    // Watch external files that launch browsersync reload
    gulp.watch(config.browsersync.watch).on('change', function () {
        bsync.reload();
    });
}

//////////////////////////////////////
// Global
//////////////////////////////////////
// Global build
gulp.task('build', function () {
    return runseq.apply(null, tasks_build);
});

// Global watch
gulp.task('watch', tasks_watch);

// Default task
gulp.task('default', function () {
    if (typeof config.browsersync !== 'undefined') {
        return runseq('build', 'bsync', 'watch');
    } else {
        return runseq('build', 'watch');
    }
});


//////////////////////////////////////
// Utils methods
//////////////////////////////////////
var Utils = {
    // Error handlers
    onError           : function (error) {
        notify.onError({
            message: error.message
        })(error);
        this.emit('end');
    },
    // Check if a file have to be ignored for lint
    lint_ignore       : function (file) {
        var exclude_file = false;

        if (typeof config.javascript.jshint_exclude === 'string') {
            exclude_file = exclude_file || match(file.path, Utils.map_match_patterns(config.javascript.jshint_exclude));
        } else if (typeof config.javascript.jshint_exclude === 'object') {
            for (var index in config.javascript.jshint_exclude) {
                if (config.javascript.jshint_exclude.hasOwnProperty(index) && typeof config.javascript.jshint_exclude[index] === 'string') {
                    exclude_file = exclude_file || match(file.path, Utils.map_match_patterns(config.javascript.jshint_exclude[index]));
                }
            }
        }

        return !exclude_file;
    },
    map_match_patterns: function (pattern) {
        return ('**/' + pattern).replace('//', '/');
    },
    map_glyphs        : function (glyph) {
        return {name: glyph.name, codepoint: glyph.unicode[0].charCodeAt(0)};
    },
    generate_hash     : function (length) {
        length = Math.abs(length) || 8;
        length = Math.min(length, 46);

        return Utils.Base64.encode(Utils.guid().replace('-', '')).substr(0, length);
    },
    guid              : function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                       .toString(16)
                       .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },
    Base64            : {

        // private property
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

        // public method for encoding
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i      = 0;

            input = Utils.Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },

        // public method for decoding
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i      = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Utils.Base64._utf8_decode(output);

            return output;

        },

        // private method for UTF-8 encoding
        _utf8_encode: function (string) {
            string      = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },

        // private method for UTF-8 decoding
        _utf8_decode: function (utftext) {
            var string = "";
            var i      = 0;
            var c      = c1 = c2 = 0;

            while (i < utftext.length) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }

    }
};
