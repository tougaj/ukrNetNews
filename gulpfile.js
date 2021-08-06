const gulp = require('gulp');
const ts = require('gulp-typescript');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');
const del = require('del');

let paths = {
	scripts: {
		src: ['src/**/*.ts', '!src/**/*.d.ts'],
		dst: './dst',
		dist: './dist',
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

	return tsResult.js.pipe(plumber()).pipe(gulp.dest(paths.scripts.dst));
}

const clean = () => del([paths.scripts.dist]);

const compress = () => {
	return gulp
		.src(`${paths.scripts.dst}/loader.js`)
		.pipe(plumber())
		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dist));
};

function watch() {
	gulp.watch(paths.scripts.src, gulp.series(typeScripts));
}

gulp.task('clean', clean);

gulp.task('ts', typeScripts);

gulp.task('default', gulp.series(typeScripts, watch));

gulp.task('build', gulp.series(clean, typeScripts, compress));
