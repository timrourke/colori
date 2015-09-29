var gulp =            require('gulp');
var sass =            require('gulp-sass');
var sourcemaps =      require('gulp-sourcemaps');
var minifyCSS =       require('gulp-minify-css');
var mainBowerFiles =  require('main-bower-files');
var uglify =          require('gulp-uglify');
var ngAnnotate =      require('gulp-ng-annotate');
var concat =          require('gulp-concat');
var notify =          require('gulp-notify');
var autoprefixer =    require('gulp-autoprefixer');
var browserSync =     require('browser-sync').create();
var htmlmin =         require('gulp-htmlmin');
var jshint =          require('gulp-jshint');
var rename =          require('gulp-rename');
var responsive =      require('gulp-responsive');
var newer =           require('gulp-newer');
var changed =         require('gulp-changed');
var plumber =         require('gulp-plumber');
var svgmin =          require('gulp-svgmin');
var svgstore =        require('gulp-svgstore');
var inject =          require('gulp-inject');
var cheerio =         require('gulp-cheerio');
var imagemin =        require('gulp-imagemin');
var pngquant =        require('imagemin-pngquant');

// libsass
gulp.task('sass', function () {
  return gulp.src('./scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: [
        './node_modules/susy/sass' //required for sass
      ]
    }))
    .pipe(autoprefixer('> 5%', 'last 2 version', 'Firefox ESR', 'Opera 12.1', 'ie 11', 'ie 10', 'ie 9'))
    .pipe(minifyCSS()) //move to prod settings
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./css/'))
    .pipe(browserSync.stream());
});

// libsass for ie stylsheets
gulp.task('sass-ie', function () {
  return gulp.src('./scss/style-ie.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: [
        './node_modules/susy/sass' //required for sass
      ]
    }))
    .pipe(autoprefixer('> 5%', 'last 2 version', 'Firefox ESR', 'Opera 12.1', 'ie 11', 'ie 10', 'ie 9'))
    .pipe(minifyCSS()) //move to prod settings
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./css/'))
    .pipe(browserSync.stream());
});

/*
 * Javascript concat and minify turned off for development.
 *
 *
 */

// javascripts
gulp.task('js', ['bower'], function() {
  return gulp.src(['./js/vendor/vendor.js', './js/global.js', './js/app/**/*.js'])
    .pipe(concat('./js-build/global.build.js'))
    //.pipe(jshint())
    .pipe(rename('global.min.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('./js-build/'))
    .pipe(browserSync.stream());
});

// grab all main bower files, concat them, and put into my vendor.js file
gulp.task('bower', function() {
  return gulp.src(mainBowerFiles(), { base: './bower_components/**'})
    .pipe(sourcemaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./js/vendor/'))
});

gulp.task('images', function() {
  browserSync.notify('Responsive images starting.');
  return gulp.src('images-source/**/*.{jpg,jpeg,png,tiff,webp,gif}')
    .pipe(changed('./images-build'))
    .pipe(plumber())
    .pipe(responsive({
      '**/*.{jpg,png,tiff,webp,gif}': [{
          width: 320,
          rename: {
            suffix: "-320"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 480,
          rename: {
            suffix: "-480"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 640,
          rename: {
            suffix: "-640"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 800,
          rename: {
            suffix: "-800"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 1024,
          rename: {
            suffix: "-1024"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 1280,
          rename: {
            suffix: "-1280"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 1600,
          rename: {
            suffix: "-1600"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 1890,
          rename: {
            suffix: "-1890"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          width: 2400,
          rename: {
            suffix: "-2400"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      },{
          rename: {
            suffix: "-original"
          },
          withoutEnlargment: true,
          passThroughUnused: false
      }]
    }))
    .pipe(imagemin({
      progressive: true,
      use: [pngquant()]
    }))
    .pipe(gulp.dest('./images-build'));
});

gulp.task('svgstore', function() {
  var svgs = gulp
    .src('./svg-source/**/*.svg')
    .pipe(svgmin())
    .pipe(cheerio({
      run: function($) {
        $('[fill]').removeAttr('fill');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(svgstore({ inlineSvg: true }));

  function fileContents (filePath, file) {
    return file.contents.toString();
  }

  return gulp
    .src('./index.html')
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest('./'));
});

// watch tasks and serve via browserSync
gulp.task('serve', ['sass', 'sass-ie', 'images', 'svgstore'], function() {
  browserSync.init({
    proxy: 'localhost:8080',
    notify: {
      styles: ['position:absolute;top:0;left:0;']
    }
  });

  gulp.watch('images-source/**/*.{jpg,jpeg,png,tiff,webp,gif}', ['images']);
  gulp.watch('./js/**/*.js', ['js'])
  gulp.watch('bower_components/**/*.js', ['bower']);
  gulp.watch('./svg-source/**/*.svg', ['svgstore']);
  gulp.watch('./scss/**', ['sass', 'sass-ie']);
  gulp.watch("**/*.html").on("change", browserSync.reload);
});

gulp.task('default', ['js', 'serve']);
