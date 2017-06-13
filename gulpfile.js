var gulp = require('gulp');
var eslint = require('gulp-eslint');
var notify = require("gulp-notify");
var express = require('express');
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var ngAnnotate = require("gulp-ng-annotate");
var del = require("del");
var gulpNgConfig = require("gulp-ng-config");
var es = require("event-stream");
var bowerFiles = require("main-bower-files");
var inject = require("gulp-inject");
var sass = require("gulp-sass");
var rename = require("gulp-rename");
var order = require("gulp-order");
var ngFileSort = require("gulp-angular-filesort");
var livereload = require('gulp-livereload');
var injectReload = require("gulp-inject-reload");
var openBrowserTab = require("gulp-open");
var babel = require("gulp-babel");
var sourcemaps = require('gulp-sourcemaps');
var htmllint = require('gulp-htmllint');

var gulpStylelint = require('gulp-stylelint');

var postcss = require('gulp-postcss');
var nested = require('postcss-nested');
var scss = require('postcss-scss');
var stylelint = require('stylelint');
var reporter = require('postcss-reporter');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var browserifyngAnnotate = require('browserify-ngannotate');
var babelify = require('babelify');
var nodesassjsonimporter = require('node-sass-json-importer');
var sassImportJson = require('gulp-sass-import-json');
var nodesass = require('node-sass');
var htmlmin = require('gulp-htmlmin');
var cssnano = require('gulp-cssnano');
var rev = require('gulp-rev');
var revAll = require('gulp-rev-all');
var fs = require('fs');

var paths = {
    devConfigPath: "./config/dev/config.json",
    prodConfigPath: "./config/prod/config.json",
    basePath: "./app", //all (images,fonts,css etc) will be copied to destination relative to this path in source
    userScriptsSrcPath: ['./app/assets/js/*.js', '!./app/assets/vendor/**/*.js'], //scripts to be validated
    vendorScriptsSrcPath: ['./app/assets/vendor/**/*.js'], //Js files not to be validated. Do not include bower folder
    //userScriptsSrcPath: ['./app/app.js'] ,
    fontsSrcPath: ['./app/assets/fonts/**/*', './app/assets/styles/fonts/**/*'],
    imagesSrcPath: ['./app/assets/images/**/*', './app/assets/vendor/**/images/*', './app/assets/vendor/**/img/*'],
    userSCSSPath: ['./app/assets/styles/main.scss'],
    vendorCSSPath: ['./app/assets/vendor/**/*.css'], //will be copied to destination as is
    vendorSCSSPath: [], //only main file
    // stylesSrcPath: ['./app/assets/**/*.css', './app/assets/**/main.scss', './app/assets/**/*.scss'], //do not include bower folder.
    stylesToValidate: [],
    indexHtmlSrcPath: './app/index.html',
    htmlFilesSrcPath: ['./app/components/**/*.html'],
    notifyJSErrors: false,
    isBowerPresent: false,
    devPort: 5001,
    prodPort: 5002,
    devDestPath: "./distDev",
    devStaticFilesPath: "distDev", //express server root
    prodDestPath: "./distProd",
    prodStaticFilesPath: "distProd", //express server root
    JSOrder: ['**/jquery.js', '**/angular.js', "**/moment.js", "**/app.js"], //only filenames
    CSSOrder: ['**/*.css'],
    Json: './app/assets/styles/variables/variables.json',
    otherFiles: ['./app/jsonFiles/**/*', './app/assets/styles/vendor/fonts/**/*']
};

var pipes = {};
var CssfileIndex = 0;

pipes.orderScripts = () => {
    return ngFileSort().pipe(order(paths.JSOrder));
}
pipes.orderCSS = () => {
    return order(paths.CSSOrder);
}

function notifyJSMessage(currentFile) {
    if (!paths.notifyJSErrors) {
        return false;
    }

    if (currentFile.eslint.errorCount) {
        var option = {};
        option.message = "";
        option.title = currentFile.eslint.filePath.length < 70 ? currentFile.eslint.filePath : currentFile.eslint.filePath.substr(currentFile.eslint.filePath.length - 70);
        for (var i = 0; i < currentFile.eslint.errorCount; i++) {
            option.message += "\n";
            option.message += currentFile.eslint.messages[i].line + ":" + currentFile.eslint.messages[i].column;
            option.message += " " + currentFile.eslint.messages[i].message;
        }
        return option;
    }
}

//Development Environment start---------------------------------
pipes.devCreateNgConfig = () => {
    return gulp.src(paths.devConfigPath)
        .pipe(gulpNgConfig('config'));
}


pipes.devGetAndCopyValidatedUserScripts = () => {
    var userScripts = gulp.src(paths.userScriptsSrcPath, {
            base: paths.basePath
        })
        .pipe(eslint())
        .pipe(notify(notifyJSMessage)).pipe(ngAnnotate()).pipe(babel());
    var configScript = pipes.devCreateNgConfig();
    return es.merge(userScripts, configScript)
        .pipe(gulp.dest(paths.devDestPath));
}

pipes.devGetVendorAndBowerScripts = () => {
    if (paths.isBowerPresent) {
        var bowerScripts = gulp.src(bowerFiles("**/*.js"));
        var vendorScripts = gulp.src(paths.vendorScriptsSrcPath);
        return es.merge(bowerScripts, vendorScripts)
            .pipe(gulp.dest(paths.devDestPath + "/scripts/vendor"));
    } else {
        return gulp.src(paths.vendorScriptsSrcPath)
            .pipe(gulp.dest(paths.devDestPath + "/scripts/vendor"));
    }
}

gulp.task("devCopyAndValidateHtmlPartials", () => {
    gulp.src(paths.htmlFilesSrcPath, {
            base: paths.basePath
        })
        .pipe(htmllint({}, htmllintReporter))
        .pipe(gulp.dest(paths.devDestPath));
});

gulp.task("prodCopyAndValidateHtmlPartials", () => {
    gulp.src(paths.htmlFilesSrcPath, {
            base: paths.basePath
        })
        .pipe(htmllint({}, htmllintReporter))
        //.pipe('minifyHtml')
        .pipe(gulp.dest(paths.devDestPath));
});

function htmllintReporter(filepath, issues) {
    if (!paths.notifyJSErrors) {
        return false;
    }
    if (issues.length > 0) {
        var option = {};
        option.message = "";
        option.title = filepath.length < 70 ? filepath : filepath.substr(filepath.length - 70);
        issues.forEach(function(issue) {
            console.log('[gulp-htmllint] ' + filepath + ' [' + issue.line + ',' + issue.column + ']: ' + '(' + issue.code + ') ' + issue.msg);
            option.message += "\n" + ' [' + issue.line + ',' + issue.column + ']: ' + '(' + issue.code + ') ' + issue.msg;
        });
        gulp.src("./package.json").pipe(notify({
            title: filepath,
            message: option.message
        }));
        process.exitCode = 1;
    }
}


gulp.task("devCopyAssetImages", () => {
    gulp.src(paths.imagesSrcPath, {
        base: paths.basePath
    }).pipe(gulp.dest(paths.devDestPath));
});
gulp.task("devCopyAssetFonts", () => {
    gulp.src(paths.fontsSrcPath, {
        base: paths.basePath
    }).pipe(gulp.dest(paths.devDestPath));
});

pipes.renameFile = () => {
    return rename(function(path) {
        path.basename = ++CssfileIndex + path.basename;
    });
}

pipes.validateUserCSSASYNC = () => {

}

pipes.devGetCompiledUserCSS = () => {
    var userCSS = gulp.src(paths.userSCSSPath, {
            base: paths.basePath
        })
        .pipe(sourcemaps.init())
        .pipe(sass({
            importer: require('node-sass-json-importer')
        }))
        .pipe(sourcemaps.write("./cssSourcemaps"))
        .pipe(gulp.dest(paths.devDestPath));

    // fs.writeFile("./tmp/main.css",userCSS,function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    //
    //     console.log("The file was saved!");
    // });
    return userCSS.pipe(pipes.orderCSS());
}
pipes.prodGetCompiledUserCSS = () => {
    var userCSS = gulp.src(paths.userSCSSPath, {
            base: paths.basePath
        })
        .pipe(sass({
            importer: require('node-sass-json-importer')
        }))
        .pipe(cssnano())
        .pipe(rev())
        .pipe(gulp.dest(paths.devDestPath));

    // fs.writeFile("./tmp/main.css",userCSS,function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    //
    //     console.log("The file was saved!");
    // });
    return userCSS.pipe(pipes.orderCSS());
}
pipes.devGetVendorAndBowerCompiledCSS = () => {
    var vendorCSS = gulp.src(paths.vendorCSSPath, {
            base: paths.basePath
        })
        .pipe(pipes.renameFile())
        .pipe(gulp.dest(paths.devDestPath));
    var vendorSCSS = gulp.src(paths.vendorSCSSPath, {
            base: paths.basePath
        })
        .pipe(sass())
        .pipe(gulp.dest(paths.devDestPath));
    if (paths.isBowerPresent) {
        //renaming has been done to prevent multiple plugins having same MAIN file names
        var bowerSCSS = gulp.src(bowerFiles("**/*.scss"))
            .pipe(sass())
            .pipe(pipes.renameFile())
            .pipe(gulp.dest(paths.devDestPath + "/BowerAndVendor/Css"));
        var bowerCSS = gulp.src(bowerFiles("**/*.css"))
            .pipe(pipes.renameFile())
            .pipe(gulp.dest(paths.devDestPath + "/BowerAndVendor/Css"));
        return es.merge(bowerCSS, bowerSCSS, vendorCSS, vendorSCSS);
    } else {
        var stream = es.merge(vendorCSS, vendorSCSS);
        return stream;
    }
}

pipes.concatVendorCss = () => {
    var vendorCSS = pipes.devGetVendorAndBowerCompiledCSS();
    //var vendorSCSS = gulp.src(paths.vendorSCSSPath)
    //  .pipe(sass());

    return vendorCSS
        .pipe(concat('vendor.css'))
        .pipe(cssnano())
        .pipe(rev())
        .pipe(gulp.dest(paths.devDestPath + '/css'));
}

// Concat vendor scripts into vendor.js
pipes.concatUglifyVendorScripts = () => {
    var bowerScripts = gulp.src(bowerFiles("**/*.js"));
    var vendorScripts = gulp.src(paths.vendorScriptsSrcPath);

    return es.merge(bowerScripts, vendorScripts)
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(paths.devDestPath + '/scripts'));
}

gulp.task("devCreateIndexhtml", () => {
    var userScripts = pipes.devGetAndCopyValidatedUserScripts();
    var vendorScripts = pipes.devGetVendorAndBowerScripts();
    var allScripts = es.merge(userScripts, vendorScripts).pipe(pipes.orderScripts());
    var vendorCSS = pipes.devGetVendorAndBowerCompiledCSS();
    var userCSS = pipes.devGetCompiledUserCSS();
    gulp.src(paths.indexHtmlSrcPath, {
            base: paths.basePath
        })
        .pipe(gulp.dest(paths.devDestPath))
        .pipe(inject(allScripts, {
            relative: true
        }))
        .pipe(inject(vendorCSS, {
            relative: true,
            name: 'bower'
        }))
        .pipe(inject(userCSS, {
            relative: true
        }))
        //.pipe(inject(userScripts, { relative: true, name: 'user' }))
        .pipe(injectReload())
        .pipe(gulp.dest(paths.devDestPath))
        .pipe(livereload());
    console.log("index created");
});

gulp.task("prodCreateIndexhtml", () => {
    var vendorScripts = pipes.concatUglifyVendorScripts();
    var vendorCSS = pipes.concatVendorCss();
    var userCSS = pipes.prodGetCompiledUserCSS();
    gulp.src(paths.indexHtmlSrcPath, {
            base: paths.basePath
        })
        .pipe(gulp.dest(paths.devDestPath))
        .pipe(inject(vendorScripts, {
            relative: true
        }))
        .pipe(inject(vendorCSS, {
            relative: true,
            name: 'bower'
        }))
        .pipe(inject(userCSS, {
            relative: true
        }))
        .pipe(inject(vendorScripts, {
            relative: true
        }))
        //.pipe(inject(userScripts, { relative: true, name: 'user' }))
        .pipe(gulp.dest(paths.devDestPath));
    console.log("index created");
});

gulp.task("deletethis", () => {
    var processors = [
        nested,
        stylelint(),
        reporter({
            clearMessages: true,
            throwError: false
        })
        // notifyCSS
    ];
    var scssValidate = gulp.src(paths.stylesToValidate)
        .pipe(postcss(processors, {
            syntax: scss
        }));
});
var temp1 = true;

function notifyCSS(eachFile) {
    if (temp1) {
        console.log(eachFile);
        temp1 = false;
    }
}

// gulp.run("deletethis");

gulp.task("watchdev", ["dev", "devStartServer"], () => {
    gulp.watch("./" + paths.basePath + "/**/*", ["dev"]);

    livereload({ start: true });
    //gulp.src("./package.json").pipe(openBrowserTab({ uri: 'http://192.168.0.106:' + paths.devPort, app: 'google-chrome' }));
    //gulp.src("./package.json").pipe(openBrowserTab({ uri: 'http://192.168.0.104:' + paths.devPort, app: 'google-chrome' }));
    gulp.src("./package.json").pipe(openBrowserTab({ uri: 'http://localhost:' + paths.devPort, app: 'google-chrome' }));
    console.log("Started Dev server on http://localhost:" + paths.devPort);
});

gulp.task("copyOtherFiles", () => {
    gulp.src(paths.otherFiles, {
            base: paths.basePath
        })
        .pipe(gulp.dest(paths.devDestPath));
});

gulp.task("dev", ["devClean", "browserifyDev", "devCreateIndexhtml", 'devCopyAndValidateHtmlPartials', 'devCopyAssetImages', 'devCopyAssetFonts', 'copyOtherFiles'], function() {
    console.log('\033c');
    CssfileIndex = 0;
});

gulp.task("prod", ["devClean", "browserifyProd", "prodCreateIndexhtml", 'prodCopyAndValidateHtmlPartials', 'minifyHtml', 'devCopyAssetImages', 'devCopyAssetFonts', 'copyOtherFiles'], function() {
    console.log('\033c');
    CssfileIndex = 0;
});

gulp.task("staging", ["devClean", "browserifyDev", "prodCreateIndexhtml", 'devCopyAndValidateHtmlPartials', 'devCopyAssetImages', 'devCopyAssetFonts', 'copyOtherFiles'], function() {
    console.log('\033c');
    CssfileIndex = 0;
});
gulp.task("default", ["watchdev"], () => {});

gulp.task('devClean', () => {
    del.sync([paths.devStaticFilesPath]);
    console.log("deleted " + paths.devDestPath);
});

gulp.task('devStartServer', () => {
    var app = express();
    app.use(express.static(__dirname + '/' + paths.devStaticFilesPath, {
        setHeaders: function(res, path) {
            res.setHeader('cache-control', 'no-cache');
        }
    }));
    app.listen(paths.devPort, '0.0.0.0');
});

var interceptErrors = (error) => {
    var args = Array.prototype.slice.call(arguments);

    // Send error to notification center with gulp-notify
    notify.onError({
        title: 'Compile Error',
        message: '<%= error.message %>'
    }).apply(this, args);

    console.log(error);

    // Keep gulp from hanging on this task
    this.emit('end');
};

gulp.task('browserifyDev', () => {
    return browserify({
            entries: './app/app.js',
            debug: true
        })
        .transform(babelify, {
            presets: ["es2015"]
        })
        .transform(browserifyngAnnotate)
        .bundle()
        .on('error', interceptErrors)
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('main.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest(paths.devDestPath));
});

gulp.task('browserifyProd', () => {
    return browserify({
            entries: './app/app.js'
        })
        .transform(babelify, {
            presets: ["es2015"]
        })
        .transform(browserifyngAnnotate)
        .bundle()
        .on('error', interceptErrors)
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('main.js'))
        .pipe(buffer()) // convert from streaming to buffered vinyl file object
        .pipe(uglify())
        //.pipe(rev())
        // Start piping stream to tasks!
        .pipe(gulp.dest(paths.devDestPath));
});

gulp.task('minifyHtml', function() {
    return gulp.src(paths.htmlFilesSrcPath, {
            base: paths.basePath
        })
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(paths.devDestPath));
});

gulp.task('revAll', function() {
    return gulp
        .src([paths.devDestPath + '/**'])
        .pipe(revAll.revision({
            dontRenameFile: ['index.html', '.map']
        }))
        .pipe(gulp.dest(paths.devDestPath))
        .pipe(revAll.manifestFile())
        .pipe(gulp.dest(paths.devDestPath));
});

//----------Development evironment end-------------------------------

// Prod Environment start---------------------------------


//----------Prod evironment end-------------------------------
