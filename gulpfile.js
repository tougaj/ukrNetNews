const gulp = require('gulp');
const ts = require('gulp-typescript');
var changed = require('gulp-changed');
// const webpack = require('webpack-stream');
// const del = require('del');
const plumber = require('gulp-plumber');

let paths = {
	scripts: {
		src: ['src/**/*.ts', '!src/**/*.d.ts'],
		dest: 'dest',
	},
};

let tsProject = ts.createProject('./tsconfig.json');

function typeScripts() {
	let tsResult = gulp
		.src(paths.scripts.src)
		.pipe(plumber())
		.pipe(
			changed('.', {
				extension: '.js',
			})
		)
		.pipe(tsProject());

	return tsResult.js.pipe(plumber()).pipe(gulp.dest(paths.scripts.dest));
}

// const sDistDir = './dist';

// const clean = () => del([sDistDir]);
// const webpackDev = () => runDevWebPack('js/**/*.js', './js/main.js');
// const webpackProd = () => runProdWebPack('js/**/*.js', './js/main.js', `${sDistDir}/js`);

function watch() {
	// gulp.watch(paths.scripts.src, gulp.series(typeScripts, webpackDev));
	gulp.watch(paths.scripts.src, gulp.series(typeScripts));
}

gulp.task('ts', typeScripts);
// gulp.task('webpack', gulp.series(typeScripts, webpackDev));

// gulp.task(
// 	'build',
// 	gulp.series(
// 		clean,
// 		styles,
// 		typeScripts,
// 		gulp.parallel(
// 			() =>
// 				gulp
// 					.src(['./*.html'])
// 					.pipe(plumber())
// 					.pipe(replace(/ts=\[\[0000000000\]\]/g, `ts=${new Date().valueOf()}`))
// 					.pipe(gulp.dest(sDistDir)),
// 			() =>
// 				gulp
// 					.src(['includes/**/*.*'])
// 					.pipe(plumber())
// 					.pipe(gulp.dest(`${sDistDir}/includes`)),
// 			() =>
// 				gulp
// 					.src(['img/**/*.*'])
// 					.pipe(plumber())
// 					.pipe(gulp.dest(`${sDistDir}/img`)),
// 			() =>
// 				gulp
// 					.src('css/**/*.css')
// 					.pipe(plumber())
// 					.pipe(cleanCSS())
// 					.pipe(gulp.dest(`${sDistDir}/css`)),
// 			webpackProd
// 		)
// 	)
// );

// let development = gulp.series(styles, typeScripts, webpackDev, watch);
let development = gulp.series(typeScripts, watch);
gulp.task('default', development);

// function runDevWebPack(sSource, sEntry) {
// 	return gulp
// 		.src(sSource)
// 		.pipe(plumber())
// 		.pipe(
// 			webpack({
// 				entry: {
// 					main: sEntry,
// 				},
// 				mode: 'development',
// 				output: {
// 					filename: '[name].bundle.js',
// 					// path: __dirname + '/js'
// 				},
// 				optimization: {
// 					splitChunks: {
// 						chunks: 'all',
// 					},
// 				},
// 				devtool: 'source-map',
// 				plugins: [
// 					new MomentLocalesPlugin({
// 						localesToKeep: ['uk'],
// 					}),
// 				],
// 			})
// 		)
// 		.pipe(gulp.dest('js'))
// 		.pipe(
// 			browserSync.reload({
// 				stream: true,
// 			})
// 		);
// }

// function runProdWebPack(sSource, sEntry, sDestination) {
// 	return (
// 		gulp
// 			.src(sSource)
// 			.pipe(plumber())
// 			.pipe(
// 				webpack({
// 					entry: {
// 						main: sEntry,
// 					},
// 					mode: 'production',
// 					output: {
// 						filename: '[name].bundle.js',
// 					},
// 					optimization: {
// 						splitChunks: {
// 							chunks: 'all',
// 						},
// 					},
// 					plugins: [
// 						new MomentLocalesPlugin({
// 							localesToKeep: ['uk'],
// 						}),
// 					],
// 				})
// 			)
// 			// .pipe(uglify({
// 			// 	compress: {
// 			// 		drop_console: true
// 			// 	}
// 			// }))
// 			.pipe(gulp.dest(sDestination))
// 	);
// }
